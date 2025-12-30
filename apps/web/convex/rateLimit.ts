import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Rate Limiting for CopilotKit - Hackathon Cost Control
 *
 * Strategy:
 * - Per-user daily limits to prevent cost explosion
 * - Different tiers for expensive vs cheap operations
 * - Graceful degradation (show cached data when limit hit)
 * - Daily reset at midnight UTC
 *
 * Limits (Daily):
 * - Chat messages: 50/day (Gemini calls)
 * - Fireplexity searches: 5/day (~$7.50/day max)
 * - Visa discovery: 10/day (Travel Buddy API)
 * - Processing times: 5/day (Perplexity API)
 * - Static searches: Unlimited (no API cost)
 */

export type ActionType =
  | "chat_message" // Gemini API calls
  | "fireplexity_search" // Perplexity + Firecrawl
  | "visa_discovery" // Travel Buddy API
  | "processing_times" // Perplexity API
  | "static_search"; // Free - no limit

interface RateLimitConfig {
  dailyLimit: number;
  costPerAction: number; // Estimated cost in cents
  gracefulFallback: boolean; // Can show cached data?
}

const RATE_LIMITS: Record<ActionType, RateLimitConfig> = {
  chat_message: {
    dailyLimit: 50, // 50 messages/day
    costPerAction: 0.01, // ~$0.0001 per Gemini call
    gracefulFallback: false,
  },
  fireplexity_search: {
    dailyLimit: 5, // 5 searches/day (~$7.50)
    costPerAction: 150, // $1.50 per search
    gracefulFallback: true, // Can show cached data
  },
  visa_discovery: {
    dailyLimit: 10, // 10 queries/day
    costPerAction: 0, // Free tier (Travel Buddy)
    gracefulFallback: true, // Can show cached data
  },
  processing_times: {
    dailyLimit: 5, // 5 queries/day
    costPerAction: 0.5, // ~$0.005 per Perplexity call
    gracefulFallback: true, // Can show cached data
  },
  static_search: {
    dailyLimit: Infinity, // No limit
    costPerAction: 0, // Free
    gracefulFallback: false,
  },
};

/**
 * Check if user can perform an action
 */
export const checkRateLimit = query({
  args: {
    userId: v.id("users"),
    action: v.union(
      v.literal("chat_message"),
      v.literal("fireplexity_search"),
      v.literal("visa_discovery"),
      v.literal("processing_times"),
      v.literal("static_search")
    ),
  },
  handler: async (ctx, { userId, action }) => {
    const config = RATE_LIMITS[action];

    // Static searches have no limit
    if (action === "static_search") {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetAt: getNextDayStart(),
      };
    }

    const now = Date.now();
    const todayStart = getDayStart(now);

    // Get or create rate limit record for today
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action_date", (q) =>
        q.eq("userId", userId).eq("action", action).eq("date", todayStart)
      )
      .first();

    const currentCount = existing?.count || 0;
    const remaining = Math.max(0, config.dailyLimit - currentCount);

    return {
      allowed: remaining > 0,
      remaining,
      limit: config.dailyLimit,
      used: currentCount,
      resetAt: getNextDayStart(),
      gracefulFallback: config.gracefulFallback,
      estimatedCost: config.costPerAction,
    };
  },
});

/**
 * Increment rate limit counter
 */
export const incrementRateLimit = mutation({
  args: {
    userId: v.id("users"),
    action: v.union(
      v.literal("chat_message"),
      v.literal("fireplexity_search"),
      v.literal("visa_discovery"),
      v.literal("processing_times"),
      v.literal("static_search")
    ),
  },
  handler: async (ctx, { userId, action }) => {
    const config = RATE_LIMITS[action];

    // Static searches don't need tracking
    if (action === "static_search") {
      return { success: true, newCount: 0 };
    }

    const now = Date.now();
    const todayStart = getDayStart(now);

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action_date", (q) =>
        q.eq("userId", userId).eq("action", action).eq("date", todayStart)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("rateLimits", {
        userId,
        action,
        date: todayStart,
        count: 1,
        lastActionAt: now,
      });
      return { success: true, newCount: 1, remaining: config.dailyLimit - 1 };
    }

    const newCount = existing.count + 1;
    await ctx.db.patch(existing._id, {
      count: newCount,
      lastActionAt: now,
    });

    return {
      success: true,
      newCount,
      remaining: Math.max(0, config.dailyLimit - newCount),
    };
  },
});

/**
 * Get user's rate limit status across all actions
 */
export const getUserRateLimitStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const todayStart = getDayStart(now);

    const limits = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayStart))
      .collect();

    const status: Record<string, any> = {};

    for (const actionType of Object.keys(RATE_LIMITS) as ActionType[]) {
      const config = RATE_LIMITS[actionType];
      const limit = limits.find((l) => l.action === actionType);
      const used = limit?.count || 0;
      const remaining = Math.max(0, config.dailyLimit - used);

      status[actionType] = {
        used,
        limit: config.dailyLimit,
        remaining,
        estimatedCost: used * config.costPerAction,
      };
    }

    const totalEstimatedCost = Object.values(status).reduce(
      (sum: number, s: any) => sum + s.estimatedCost,
      0
    );

    return {
      status,
      totalEstimatedCostCents: totalEstimatedCost,
      totalEstimatedCostDollars: (totalEstimatedCost / 100).toFixed(2),
      resetAt: getNextDayStart(),
    };
  },
});

/**
 * Admin: Reset rate limits for a user
 */
export const resetUserRateLimits = mutation({
  args: {
    userId: v.id("users"),
    action: v.optional(
      v.union(
        v.literal("chat_message"),
        v.literal("fireplexity_search"),
        v.literal("visa_discovery"),
        v.literal("processing_times"),
        v.literal("static_search")
      )
    ),
  },
  handler: async (ctx, { userId, action }) => {
    const now = Date.now();
    const todayStart = getDayStart(now);

    if (action) {
      // Reset specific action
      const existing = await ctx.db
        .query("rateLimits")
        .withIndex("by_user_action_date", (q) =>
          q.eq("userId", userId).eq("action", action).eq("date", todayStart)
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
      }

      return { success: true, action, reset: !!existing };
    } else {
      // Reset all actions for today
      const allLimits = await ctx.db
        .query("rateLimits")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", todayStart))
        .collect();

      for (const limit of allLimits) {
        await ctx.db.delete(limit._id);
      }

      return { success: true, action: "all", reset: allLimits.length };
    }
  },
});

// Helper functions

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function getNextDayStart(): number {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  now.setUTCDate(now.getUTCDate() + 1);
  return now.getTime();
}
