"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { briefingWriter, buildBriefingPrompt } from "../../agents/briefingWriter";
import Anthropic from "@anthropic-ai/sdk";

type BriefingType = "daily" | "weekly" | "progress";

interface BriefingResult {
  script: string;
  cached: boolean;
  wordCount: number;
  briefingId?: string;
}

interface UserProfile {
  _id: Id<"users">;
  language?: string;
}

interface Corridor {
  origin: string;
  destination: string;
  stage?: string;
}

interface Protocol {
  _id: Id<"protocols">;
  title: string;
  order: number;
}

interface Progress {
  protocolId: Id<"protocols">;
  completedAt: number;
}

interface CachedBriefing {
  _id: Id<"briefings">;
  script: string;
  wordCount: number;
  createdAt: number;
  audioStatus?: "pending" | "ready" | "failed";
}

interface Briefing {
  _id: Id<"briefings">;
  script: string;
  language: string;
  wordCount: number;
}

const WORD_TARGETS: Record<BriefingType, { min: number; max: number }> = {
  daily: { min: 400, max: 500 },
  weekly: { min: 900, max: 1100 },
  progress: { min: 150, max: 250 },
};

// Cache duration in milliseconds
const CACHE_DURATION: Record<BriefingType, number> = {
  daily: 12 * 60 * 60 * 1000, // 12 hours
  weekly: 24 * 60 * 60 * 1000, // 24 hours
  progress: 1 * 60 * 60 * 1000, // 1 hour (regenerate more often)
};

export const generateBriefingScript = action({
  args: {
    corridorId: v.id("corridors"),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("progress")),
    forceRegenerate: v.optional(v.boolean()),
  },
  handler: async (ctx, { corridorId, type, forceRegenerate = false }): Promise<BriefingResult> => {
    const startTime = Date.now();

    // Get user profile
    const profile = (await ctx.runQuery(
      internal.briefingsQueries.getCurrentUser
    )) as UserProfile | null;
    if (!profile) throw new Error("User not found");

    // Check for cached briefing
    if (!forceRegenerate) {
      const cached = (await ctx.runQuery(
        internal.briefingsQueries.getLatestBriefingInternal,
        {
          userId: profile._id,
          corridorId,
          type,
        }
      )) as CachedBriefing | null;

      // Return cached if recent enough
      const maxAge = CACHE_DURATION[type];
      if (cached && Date.now() - cached.createdAt < maxAge) {
        return {
          script: cached.script,
          cached: true,
          wordCount: cached.wordCount,
          briefingId: cached._id,
        };
      }
    }

    // Get corridor info
    const corridor = (await ctx.runQuery(
      internal.briefingsQueries.getCorridorInternal,
      { id: corridorId }
    )) as Corridor | null;

    if (!corridor) throw new Error("Corridor not found");

    // Get protocols for this corridor
    const protocols = (await ctx.runQuery(
      internal.briefingsQueries.getProtocolsInternal,
      { corridorId }
    )) as Protocol[];

    // Get user progress
    const progress = (await ctx.runQuery(
      internal.briefingsQueries.getProgressInternal,
      { userId: profile._id, corridorId }
    )) as Progress[];

    // Calculate progress stats
    const completedIds = new Set(progress.map((p: Progress) => p.protocolId));
    const completedSteps = completedIds.size;
    const totalSteps = protocols.length;

    // Get recent completions (last 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCompletions = progress
      .filter((p: Progress) => p.completedAt > oneWeekAgo)
      .map((p: Progress) => {
        const protocol = protocols.find((pr: Protocol) => pr._id === p.protocolId);
        return protocol?.title;
      })
      .filter((title: string | undefined): title is string => Boolean(title));

    // Get next steps (incomplete, sorted by order)
    const nextSteps = protocols
      .filter((p: Protocol) => !completedIds.has(p._id))
      .sort((a: Protocol, b: Protocol) => a.order - b.order)
      .slice(0, 3)
      .map((p: Protocol) => p.title);

    // === ENHANCED DATA AGGREGATION (10 sources for Stories 9.10-9.12) ===
    // TODO: Implement these query functions in briefingQueries.ts

    // Source 7: Get todos/tasks
    // const todos = await ctx.runQuery(internal.briefingsQueries.getUserTodos, {
    //   userId: profile._id,
    //   corridorId,
    //   limit: 5,
    // }).catch(() => []);

    // Source 8: Get recent documents
    // const documents = await ctx.runQuery(internal.briefingsQueries.getRecentDocuments, {
    //   userId: profile._id,
    //   corridorId,
    //   days: 3,
    // }).catch(() => []);

    // Source 9: Get feed alerts
    // const feedAlerts = await ctx.runQuery(internal.briefingsQueries.getFeedAlerts, {
    //   corridorId,
    //   hours: 24,
    // }).catch(() => []);

    // Source 10: Get financial summary
    // const financialData = await ctx.runQuery(internal.briefingsQueries.getFinancialSummary, {
    //   userId: profile._id,
    //   corridorId,
    // }).catch(() => null);

    // Source 11: Get savings goals
    // const savingsGoals = await ctx.runQuery(internal.briefingsQueries.getSavingsGoals, {
    //   corridorId,
    // }).catch(() => []);

    // Source 12: Get corridor stats
    // const corridorStats = await ctx.runQuery(internal.briefingsQueries.getCorridorStats, {
    //   corridorId,
    // }).catch(() => null);

    // Sources 13-15: Perplexity news/jobs/culture (will be called in the enhanced prompt)
    // These are fetched via separate action calls to avoid timeout

    // Build prompt
    const prompt = buildBriefingPrompt({
      type,
      language: profile.language ?? "en",
      corridor: {
        origin: corridor.origin,
        destination: corridor.destination,
      },
      stage: corridor.stage ?? "planning",
      completedSteps,
      totalSteps,
      recentCompletions,
      nextSteps,
      wordTarget: WORD_TARGETS[type],
    });

    // Generate script using the briefing writer agent
    const result = await briefingWriter.generate(prompt);
    const script = result.text;
    const wordCount = script.split(/\s+/).length;

    // Save to database and get the briefingId
    const briefingId = await ctx.runMutation(internal.briefingsQueries.saveBriefingInternal, {
      userId: profile._id,
      corridorId,
      type,
      script,
      wordCount,
      language: profile.language ?? "en",
      context: {
        stage: corridor.stage ?? "planning",
        completedSteps,
        totalSteps,
        recentCompletions,
      },
    });

    // Schedule audio generation in the background
    await ctx.scheduler.runAfter(0, api.ai.tts.generateAudio, {
      briefingId,
    });

    // Log token usage for monitoring
    await ctx.runMutation(internal.briefingsQueries.logBriefingUsage, {
      type,
      corridorId,
      wordCount,
      latencyMs: Date.now() - startTime,
    });

    console.log(`Briefing generated in ${Date.now() - startTime}ms, ${wordCount} words`);

    return { script, cached: false, wordCount, briefingId };
  },
});

// === GOOGLE CLOUD TEXT-TO-SPEECH INTEGRATION (Story 9.12) ===

/**
 * Generate audio using Google Cloud TTS (220+ languages)
 * Alternative to ElevenLabs for multi-language support
 */
export const generateAudioWithGoogleTTS = action({
  args: {
    briefingId: v.id("briefings"),
    languageCode: v.optional(v.string()), // e.g., "en-US", "fr-CA", "hi-IN"
    voiceName: v.optional(v.string()), // e.g., "en-US-Neural2-A"
    speakingRate: v.optional(v.number()), // 0.25-4.0, default 1.0
  },
  handler: async (ctx, { briefingId, languageCode, voiceName, speakingRate = 1.0 }) => {
    const startTime = Date.now();

    // Get briefing details
    const briefing = (await ctx.runQuery(
      internal.ttsQueries.getBriefingById,
      { id: briefingId }
    )) as Briefing | null;

    if (!briefing) {
      throw new Error("Briefing not found");
    }

    try {
      // Update status to pending
      await ctx.runMutation(internal.ttsQueries.updateAudioStatus, {
        briefingId,
        status: "pending",
      });

      // Import Google Cloud TTS
      const textToSpeech = require("@google-cloud/text-to-speech");
      const client = new textToSpeech.TextToSpeechClient();

      // Auto-detect voice if not provided
      const finalLanguageCode = languageCode || briefing.language || "en-US";
      const finalVoiceName = voiceName || getDefaultVoiceForLanguage(finalLanguageCode);

      // Adjust speaking rate based on language (some languages need slower speech)
      const adjustedRate = adjustSpeakingRateForLanguage(finalLanguageCode, speakingRate);

      // Request configuration
      const request = {
        input: { text: briefing.script },
        voice: {
          languageCode: finalLanguageCode,
          name: finalVoiceName,
        },
        audioConfig: {
          audioEncoding: "MP3" as const,
          speakingRate: adjustedRate,
          pitch: 0,
          volumeGainDb: 0,
        },
      };

      // Generate audio
      const [response] = await client.synthesizeSpeech(request);
      const audioBuffer = response.audioContent;

      // Store in Convex file storage
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const storageId = await ctx.storage.store(blob);

      // Estimate duration (words per minute varies by language)
      const wpm = getWordsPerMinuteForLanguage(finalLanguageCode);
      const duration = Math.ceil((briefing.wordCount / wpm) * 60);

      // Update briefing with audio info
      await ctx.runMutation(internal.ttsQueries.updateAudioStatus, {
        briefingId,
        status: "ready",
        audioStorageId: storageId,
        audioDuration: duration,
      });

      // Log TTS usage
      await ctx.runMutation(internal.ttsQueries.logTTSUsage, {
        briefingId,
        wordCount: briefing.wordCount,
        latencyMs: Date.now() - startTime,
      });

      console.log(`Google TTS audio generated in ${Date.now() - startTime}ms, ${briefing.wordCount} words, ${finalLanguageCode}`);

      return { storageId, duration, languageCode: finalLanguageCode };
    } catch (error) {
      console.error("Google TTS generation failed:", error);

      await ctx.runMutation(internal.ttsQueries.updateAudioStatus, {
        briefingId,
        status: "failed",
      });

      throw error;
    }
  },
});

// === MULTI-LANGUAGE TRANSLATION WITH CLAUDE (Story 9.12) ===

/**
 * Translate briefing script to target language with cultural adaptation
 * Uses Claude for context-preserving translation
 */
export const translateBriefingScript = action({
  args: {
    script: v.string(),
    targetLanguage: v.string(), // ISO 639-1 code (en, fr, es, hi, etc.)
    originCountry: v.string(),
    destinationCountry: v.string(),
  },
  handler: async (ctx, { script, targetLanguage, originCountry, destinationCountry }) => {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const languageName = getLanguageName(targetLanguage);

    const prompt = `You are a professional translator specializing in migration-related content. Translate the following migration briefing to ${languageName}.

TRANSLATION GUIDELINES:
1. Preserve the personal, warm, and motivational tone
2. Keep technical migration terms (visa types, legal terms) in original language if commonly used
3. Adapt idioms and expressions to target culture while maintaining the intended meaning
4. Maintain the section structure and formatting
5. Format dates, currency, and measurements according to ${languageName} locale conventions
6. Use appropriate honorifics and formality level for ${languageName} culture
7. Adapt motivational messages to resonate with ${languageName}-speaking migrants

CONTEXT:
- Origin country: ${originCountry}
- Destination country: ${destinationCountry}
- This briefing helps migrants track their journey progress

ORIGINAL SCRIPT (English):
${script}

Provide ONLY the translated script in ${languageName}, maintaining the same structure and warmth.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const translatedScript = message.content[0].type === "text" ? message.content[0].text : "";

    return {
      translatedScript,
      wordCount: translatedScript.split(/\s+/).length,
      targetLanguage,
      languageName,
    };
  },
});

// === HELPER FUNCTIONS ===

function getDefaultVoiceForLanguage(languageCode: string): string {
  const voiceMap: Record<string, string> = {
    "en-US": "en-US-Neural2-A",
    "en-GB": "en-GB-Neural2-A",
    "en-CA": "en-CA-Neural2-A",
    "fr-FR": "fr-FR-Neural2-A",
    "fr-CA": "fr-CA-Neural2-A",
    "es-ES": "es-ES-Neural2-A",
    "es-MX": "es-MX-Neural2-A",
    "hi-IN": "hi-IN-Neural2-A",
    "pt-BR": "pt-BR-Neural2-A",
    "pt-PT": "pt-PT-Neural2-A",
    "de-DE": "de-DE-Neural2-A",
    "ko-KR": "ko-KR-Neural2-A",
    "tl-PH": "tl-PH-Neural2-A", // Tagalog
    "yo-NG": "yo-NG-Neural2-A", // Yoruba
  };
  return voiceMap[languageCode] || `${languageCode}-Neural2-A`;
}

function adjustSpeakingRateForLanguage(languageCode: string, baseRate: number): number {
  // Some languages naturally speak faster/slower
  const rateAdjustments: Record<string, number> = {
    "hi-IN": 0.9, // Hindi - slightly slower for clarity
    "yo-NG": 0.95, // Yoruba - slightly slower
    "tl-PH": 0.95, // Tagalog - slightly slower
    "ko-KR": 0.95, // Korean - slightly slower
  };
  const adjustment = rateAdjustments[languageCode] || 1.0;
  return baseRate * adjustment;
}

function getWordsPerMinuteForLanguage(languageCode: string): number {
  // Average words per minute varies by language
  const wpmMap: Record<string, number> = {
    "en-US": 150,
    "en-GB": 150,
    "fr-FR": 160,
    "es-ES": 170,
    "hi-IN": 140,
    "pt-BR": 160,
    "de-DE": 150,
    "ko-KR": 130,
    "tl-PH": 140,
    "yo-NG": 140,
  };
  return wpmMap[languageCode] || 150;
}

function getLanguageName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    en: "English",
    fr: "French",
    es: "Spanish",
    hi: "Hindi",
    pt: "Portuguese",
    de: "German",
    ko: "Korean",
    tl: "Tagalog",
    yo: "Yoruba",
    ar: "Arabic",
    zh: "Chinese",
    ja: "Japanese",
    ru: "Russian",
    it: "Italian",
    pl: "Polish",
  };
  return languageNames[languageCode] || languageCode.toUpperCase();
}
