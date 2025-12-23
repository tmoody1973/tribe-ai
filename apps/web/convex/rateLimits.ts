import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Rate limit configuration: 10 requests per hour per user
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Check rate limit for a user/action pair
 */
export const checkRateLimit = internalQuery({
  args: {
    userId: v.string(),
    action: v.string(),
  },
  handler: async (ctx, { userId, action }) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Find existing rate limit record for this user/action
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action", (q) =>
        q.eq("userId", userId).eq("action", action)
      )
      .first();

    if (!existing) {
      return { allowed: true, count: 0, remaining: RATE_LIMIT_MAX_REQUESTS };
    }

    // If window has expired, reset
    if (existing.windowStart < windowStart) {
      return { allowed: true, count: 0, remaining: RATE_LIMIT_MAX_REQUESTS };
    }

    // Check if under limit
    const allowed = existing.count < RATE_LIMIT_MAX_REQUESTS;
    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count);

    return { allowed, count: existing.count, remaining };
  },
});

/**
 * Increment rate limit counter for a user/action pair
 */
export const incrementRateLimit = internalMutation({
  args: {
    userId: v.string(),
    action: v.string(),
  },
  handler: async (ctx, { userId, action }) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Find existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action", (q) =>
        q.eq("userId", userId).eq("action", action)
      )
      .first();

    if (!existing || existing.windowStart < windowStart) {
      // Create new or reset window
      if (existing) {
        await ctx.db.patch(existing._id, {
          windowStart: now,
          count: 1,
        });
      } else {
        await ctx.db.insert("rateLimits", {
          userId,
          action,
          windowStart: now,
          count: 1,
        });
      }
    } else {
      // Increment existing
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
      });
    }
  },
});
