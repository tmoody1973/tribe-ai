import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

/**
 * Tier 2 Smart Fireplexity Integration - Queries and Mutations
 *
 * Budget: 50 Fireplexity queries/month
 * Strategy: Static data first, smart live search fallback
 * Cost: ~$75/month (50 × $1.50 average)
 */

const MONTHLY_FIREPLEXITY_LIMIT = 50;

// Helper functions

function getNextMonthStart(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.getTime();
}

function daysUntilMonthEnd(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if Fireplexity quota is available
 */
export const checkFireplexityQuota = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    // Get or create quota record for this month
    const quota = await ctx.db
      .query("apiQuota")
      .withIndex("by_service", (q) => q.eq("service", "fireplexity"))
      .first();

    if (!quota) {
      return {
        available: true,
        used: 0,
        limit: MONTHLY_FIREPLEXITY_LIMIT,
        remaining: MONTHLY_FIREPLEXITY_LIMIT,
        resetDate: getNextMonthStart(),
        daysUntilReset: daysUntilMonthEnd(),
      };
    }

    // Check if quota has reset (new month)
    const quotaMonth = new Date(quota.resetDate).getMonth();
    const quotaYear = new Date(quota.resetDate).getFullYear();

    if (quotaMonth !== currentMonth || quotaYear !== currentYear) {
      // New month - reset quota
      return {
        available: true,
        used: 0,
        limit: MONTHLY_FIREPLEXITY_LIMIT,
        remaining: MONTHLY_FIREPLEXITY_LIMIT,
        resetDate: getNextMonthStart(),
        daysUntilReset: daysUntilMonthEnd(),
      };
    }

    const remaining = MONTHLY_FIREPLEXITY_LIMIT - quota.callCount;

    return {
      available: remaining > 0,
      used: quota.callCount,
      limit: MONTHLY_FIREPLEXITY_LIMIT,
      remaining: Math.max(0, remaining),
      resetDate: quota.resetDate,
      daysUntilReset: daysUntilMonthEnd(),
    };
  },
});

/**
 * Increment Fireplexity usage counter (internal only)
 */
export const logFireplexityUsage = internalMutation({
  args: {
    endpoint: v.string(),
    query: v.string(),
  },
  handler: async (ctx, { endpoint, query }) => {
    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    // Get existing quota record
    const quota = await ctx.db
      .query("apiQuota")
      .withIndex("by_service", (q) => q.eq("service", "fireplexity"))
      .first();

    if (!quota) {
      // Create new quota record
      await ctx.db.insert("apiQuota", {
        service: "fireplexity",
        endpoint,
        callCount: 1,
        resetDate: getNextMonthStart(),
        lastCallAt: now,
      });
      return { success: true, newCount: 1 };
    }

    // Check if quota has reset (new month)
    const quotaMonth = new Date(quota.resetDate).getMonth();
    const quotaYear = new Date(quota.resetDate).getFullYear();

    if (quotaMonth !== currentMonth || quotaYear !== currentYear) {
      // New month - reset counter
      await ctx.db.patch(quota._id, {
        callCount: 1,
        resetDate: getNextMonthStart(),
        lastCallAt: now,
        endpoint,
      });
      return { success: true, newCount: 1 };
    }

    // Increment counter
    const newCount = quota.callCount + 1;
    await ctx.db.patch(quota._id, {
      callCount: newCount,
      lastCallAt: now,
      endpoint,
    });

    return { success: true, newCount };
  },
});
