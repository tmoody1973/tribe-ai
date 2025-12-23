"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { briefingWriter, buildBriefingPrompt } from "../../agents/briefingWriter";

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
