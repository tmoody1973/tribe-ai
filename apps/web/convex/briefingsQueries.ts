import { internalQuery, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current user (internal, for actions)
 */
export const getCurrentUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

/**
 * Get corridor by ID (internal, for actions)
 */
export const getCorridorInternal = internalQuery({
  args: {
    id: v.id("corridors"),
  },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

/**
 * Get protocols for a corridor (internal, for actions)
 */
export const getProtocolsInternal = internalQuery({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    return ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();
  },
});

/**
 * Get user progress for a corridor (internal, for actions)
 */
export const getProgressInternal = internalQuery({
  args: {
    userId: v.id("users"),
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { userId, corridorId }) => {
    return ctx.db
      .query("userProgress")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", userId).eq("corridorId", corridorId)
      )
      .collect();
  },
});

/**
 * Get latest briefing for caching check (internal, for actions)
 */
export const getLatestBriefingInternal = internalQuery({
  args: {
    userId: v.id("users"),
    corridorId: v.id("corridors"),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("progress")),
  },
  handler: async (ctx, { userId, corridorId, type }) => {
    return ctx.db
      .query("briefings")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", userId).eq("corridorId", corridorId)
      )
      .filter((q) => q.eq(q.field("type"), type))
      .order("desc")
      .first();
  },
});

/**
 * Save a new briefing (internal, for actions)
 */
export const saveBriefingInternal = internalMutation({
  args: {
    userId: v.id("users"),
    corridorId: v.id("corridors"),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("progress")),
    script: v.string(),
    wordCount: v.number(),
    language: v.string(),
    context: v.object({
      stage: v.string(),
      completedSteps: v.number(),
      totalSteps: v.number(),
      recentCompletions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("briefings", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Log briefing generation for monitoring
 */
export const logBriefingUsage = internalMutation({
  args: {
    type: v.string(),
    corridorId: v.id("corridors"),
    wordCount: v.number(),
    latencyMs: v.number(),
  },
  handler: async (ctx, { type, corridorId, wordCount, latencyMs }) => {
    // Estimate tokens (rough: 1 word ≈ 1.3 tokens)
    const estimatedTokens = Math.round(wordCount * 1.3);

    return ctx.db.insert("tokenUsage", {
      model: "gemini-3-flash",
      inputTokens: 500, // Rough estimate for prompt
      outputTokens: estimatedTokens,
      action: `briefing_${type}`,
      corridorId,
      timestamp: Date.now(),
    });
  },
});

// ===== Public queries for the frontend =====

/**
 * Get latest briefing for current user
 */
export const getLatestBriefing = query({
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

    return ctx.db
      .query("briefings")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .filter((q) => q.eq(q.field("type"), type))
      .order("desc")
      .first();
  },
});

/**
 * Get briefing history for current user
 */
export const getBriefingHistory = query({
  args: {
    corridorId: v.id("corridors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { corridorId, limit = 10 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return ctx.db
      .query("briefings")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Check if briefing needs regeneration (significant progress change)
 */
export const shouldRegenerateBriefing = query({
  args: {
    corridorId: v.id("corridors"),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("progress")),
  },
  handler: async (ctx, { corridorId, type }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { shouldRegenerate: true, reason: "No user" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return { shouldRegenerate: true, reason: "User not found" };

    // Get latest briefing
    const latestBriefing = await ctx.db
      .query("briefings")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .filter((q) => q.eq(q.field("type"), type))
      .order("desc")
      .first();

    if (!latestBriefing) {
      return { shouldRegenerate: true, reason: "No existing briefing" };
    }

    // Get current progress
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    const currentCompleted = progress.length;
    const savedCompleted = latestBriefing.context.completedSteps;

    // Regenerate if significant progress change (2+ new completions)
    if (currentCompleted - savedCompleted >= 2) {
      return {
        shouldRegenerate: true,
        reason: `Progress changed: ${savedCompleted} → ${currentCompleted}`,
      };
    }

    // Check time-based expiry
    const cacheAges: Record<string, number> = {
      daily: 12 * 60 * 60 * 1000,
      weekly: 24 * 60 * 60 * 1000,
      progress: 1 * 60 * 60 * 1000,
    };

    const maxAge = cacheAges[type] ?? cacheAges.daily;
    const age = Date.now() - latestBriefing.createdAt;

    if (age > maxAge) {
      return { shouldRegenerate: true, reason: "Briefing expired" };
    }

    return { shouldRegenerate: false, reason: "Briefing is current" };
  },
});
