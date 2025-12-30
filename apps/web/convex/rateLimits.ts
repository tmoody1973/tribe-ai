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
    const todayStart = new Date(now).setHours(0, 0, 0, 0);

    // Find existing rate limit record for this user/action
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId as any)
      )
      .filter((q) => q.eq(q.field("action"), action))
      .first();

    if (!existing) {
      return { allowed: true, count: 0, remaining: RATE_LIMIT_MAX_REQUESTS };
    }

    // If date has changed (new day), reset
    if (existing.date < todayStart) {
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
    const todayStart = new Date(now).setHours(0, 0, 0, 0);

    // Find existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId as any)
      )
      .filter((q) => q.eq(q.field("action"), action))
      .first();

    if (!existing || existing.date < todayStart) {
      // Create new or reset for new day
      if (existing) {
        await ctx.db.patch(existing._id, {
          date: todayStart,
          count: 1,
          lastActionAt: now,
        });
      } else {
        await ctx.db.insert("rateLimits", {
          userId: userId as any,
          action: action as any,
          date: todayStart,
          count: 1,
          lastActionAt: now,
        });
      }
    } else {
      // Increment existing
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        lastActionAt: now,
      });
    }
  },
});
