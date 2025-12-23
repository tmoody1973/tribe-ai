"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { textToSpeech, estimateAudioDuration } from "../../lib/elevenlabs";

interface Briefing {
  _id: Id<"briefings">;
  script: string;
  language: string;
  wordCount: number;
}

/**
 * Generate audio from a briefing script using ElevenLabs TTS
 * Stores the audio in Convex file storage
 */
export const generateAudio = action({
  args: {
    briefingId: v.id("briefings"),
  },
  handler: async (ctx, { briefingId }) => {
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

      // Get API key from environment
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error("ELEVENLABS_API_KEY not configured");
      }

      // Generate audio
      const { audioBuffer, contentType } = await textToSpeech(
        briefing.script,
        briefing.language,
        apiKey
      );

      // Store in Convex file storage
      const blob = new Blob([audioBuffer], { type: contentType });
      const storageId = await ctx.storage.store(blob);

      // Estimate duration
      const duration = estimateAudioDuration(briefing.wordCount);

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

      console.log(`Audio generated in ${Date.now() - startTime}ms, ${briefing.wordCount} words`);

      return { storageId, duration };
    } catch (error) {
      console.error("Audio generation failed:", error);

      await ctx.runMutation(internal.ttsQueries.updateAudioStatus, {
        briefingId,
        status: "failed",
      });

      throw error;
    }
  },
});

interface GenerateAudioResult {
  storageId: Id<"_storage">;
  duration: number;
}

/**
 * Retry audio generation for a failed briefing
 */
export const retryAudioGeneration = action({
  args: {
    briefingId: v.id("briefings"),
  },
  handler: async (ctx, { briefingId }): Promise<GenerateAudioResult> => {
    // Reset status and regenerate
    await ctx.runMutation(internal.ttsQueries.updateAudioStatus, {
      briefingId,
      status: "pending",
    });

    // Call the main generate action - use api since it's a public action
    const result = (await ctx.runAction(api.ai.tts.generateAudio, {
      briefingId,
    })) as GenerateAudioResult;
    return result;
  },
});
