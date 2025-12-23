import { internalQuery, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get briefing by ID (internal, for actions)
 */
export const getBriefingById = internalQuery({
  args: {
    id: v.id("briefings"),
  },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

/**
 * Update audio status on a briefing
 */
export const updateAudioStatus = internalMutation({
  args: {
    briefingId: v.id("briefings"),
    status: v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
    audioStorageId: v.optional(v.id("_storage")),
    audioDuration: v.optional(v.number()),
  },
  handler: async (ctx, { briefingId, status, audioStorageId, audioDuration }) => {
    await ctx.db.patch(briefingId, {
      audioStatus: status,
      ...(audioStorageId && { audioStorageId }),
      ...(audioDuration !== undefined && { audioDuration }),
    });
  },
});

/**
 * Log TTS usage for monitoring
 */
export const logTTSUsage = internalMutation({
  args: {
    briefingId: v.id("briefings"),
    wordCount: v.number(),
    latencyMs: v.number(),
  },
  handler: async (ctx, { wordCount, latencyMs }) => {
    // ElevenLabs charges by character, estimate tokens
    const estimatedCharacters = wordCount * 5; // avg 5 chars per word

    return ctx.db.insert("tokenUsage", {
      model: "elevenlabs-multilingual-v2",
      inputTokens: estimatedCharacters, // Using chars as "tokens" for ElevenLabs
      outputTokens: 0,
      action: "tts_generation",
      timestamp: Date.now(),
    });
  },
});

// ===== Public queries for the frontend =====

/**
 * Get audio URL for a briefing
 */
export const getAudioUrl = query({
  args: {
    briefingId: v.id("briefings"),
  },
  handler: async (ctx, { briefingId }) => {
    const briefing = await ctx.db.get(briefingId);
    if (!briefing || !briefing.audioStorageId) {
      return null;
    }

    const url = await ctx.storage.getUrl(briefing.audioStorageId);
    return {
      url,
      status: briefing.audioStatus,
      duration: briefing.audioDuration,
    };
  },
});

/**
 * Get briefing with audio info for current user
 */
export const getBriefingWithAudio = query({
  args: {
    corridorId: v.id("corridors"),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("progress")),
  },
  handler: async (ctx, { corridorId, type }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const briefing = await ctx.db
      .query("briefings")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .filter((q) => q.eq(q.field("type"), type))
      .order("desc")
      .first();

    if (!briefing) return null;

    // Get audio URL if available
    let audioUrl: string | null = null;
    if (briefing.audioStorageId) {
      audioUrl = await ctx.storage.getUrl(briefing.audioStorageId);
    }

    return {
      ...briefing,
      audioUrl,
    };
  },
});
