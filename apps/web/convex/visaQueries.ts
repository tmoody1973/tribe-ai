import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";

const FREE_TIER_LIMIT = 120;

/**
 * INTERNAL: Get cached visa requirements
 */
export const getCachedVisaRequirements = internalQuery({
  args: {
    origin: v.string(),
    destination: v.string(),
  },
  handler: async (ctx, { origin, destination }) => {
    const cached = await ctx.db
      .query("visaRequirements")
      .withIndex("by_corridor", (q) => q.eq("origin", origin).eq("destination", destination))
      .first();

    return cached;
  },
});

/**
 * INTERNAL: Cache visa requirements
 */
export const cacheVisaRequirements = internalMutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    visaData: v.any(),
  },
  handler: async (ctx, { origin, destination, visaData }) => {
    const now = Date.now();
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiresAt = now + CACHE_DURATION;

    // Check if already exists
    const existing = await ctx.db
      .query("visaRequirements")
      .withIndex("by_corridor", (q) => q.eq("origin", origin).eq("destination", destination))
      .first();

    const data = {
      origin,
      destination,
      visaRequired: visaData.visaRequired,
      visaType: visaData.visaType,
      stayDuration: visaData.stayDuration,
      requirements: visaData.requirements || [],
      processingTime: visaData.processingTime,
      cost: visaData.cost,
      cachedAt: now,
      expiresAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return { ...data, _id: existing._id };
    } else {
      const id = await ctx.db.insert("visaRequirements", data);
      return { ...data, _id: id };
    }
  },
});

/**
 * INTERNAL: Check Travel Buddy API quota
 */
export const checkTravelBuddyQuota = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    const quota = await ctx.db
      .query("apiQuota")
      .withIndex("by_service", (q) => q.eq("service", "travel_buddy"))
      .first();

    if (!quota) {
      return {
        available: true,
        used: 0,
        limit: FREE_TIER_LIMIT,
        remaining: FREE_TIER_LIMIT,
        resetDate: getNextMonthStart(),
        daysUntilReset: daysUntilMonthEnd(),
      };
    }

    // Check if quota has reset (new month)
    const quotaMonth = new Date(quota.resetDate).getMonth();
    const quotaYear = new Date(quota.resetDate).getFullYear();

    if (quotaMonth !== currentMonth || quotaYear !== currentYear) {
      return {
        available: true,
        used: 0,
        limit: FREE_TIER_LIMIT,
        remaining: FREE_TIER_LIMIT,
        resetDate: getNextMonthStart(),
        daysUntilReset: daysUntilMonthEnd(),
      };
    }

    const remaining = FREE_TIER_LIMIT - quota.callCount;

    return {
      available: remaining > 0,
      used: quota.callCount,
      limit: FREE_TIER_LIMIT,
      remaining: Math.max(0, remaining),
      resetDate: quota.resetDate,
      daysUntilReset: daysUntilMonthEnd(),
    };
  },
});

/**
 * INTERNAL: Log Travel Buddy API usage
 */
export const logTravelBuddyUsage = internalMutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, { endpoint }) => {
    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    const quota = await ctx.db
      .query("apiQuota")
      .withIndex("by_service", (q) => q.eq("service", "travel_buddy"))
      .first();

    if (!quota) {
      await ctx.db.insert("apiQuota", {
        service: "travel_buddy",
        endpoint,
        callCount: 1,
        resetDate: getNextMonthStart(),
        lastCallAt: now,
      });
      return { success: true, newCount: 1 };
    }

    // Check if quota has reset
    const quotaMonth = new Date(quota.resetDate).getMonth();
    const quotaYear = new Date(quota.resetDate).getFullYear();

    if (quotaMonth !== currentMonth || quotaYear !== currentYear) {
      await ctx.db.patch(quota._id, {
        callCount: 1,
        resetDate: getNextMonthStart(),
        lastCallAt: now,
        endpoint,
      });
      return { success: true, newCount: 1 };
    }

    const newCount = quota.callCount + 1;
    await ctx.db.patch(quota._id, {
      callCount: newCount,
      lastCallAt: now,
      endpoint,
    });

    return { success: true, newCount };
  },
});

/**
 * INTERNAL: Get cached processing times
 */
export const getCachedProcessingTimes = internalQuery({
  args: {
    origin: v.string(),
    destination: v.string(),
    visaType: v.string(),
  },
  handler: async (ctx, { origin, destination, visaType }) => {
    const cached = await ctx.db
      .query("processingTimes")
      .withIndex("by_corridor", (q) => q.eq("origin", origin).eq("destination", destination))
      .filter((q) => q.eq(q.field("visaType"), visaType))
      .order("desc")
      .first();

    return cached;
  },
});

/**
 * INTERNAL: Cache processing times
 */
export const cacheProcessingTimes = internalMutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    visaType: v.string(),
    averageDays: v.number(),
    source: v.union(
      v.literal("manual_research"),
      v.literal("perplexity"),
      v.literal("user_reported"),
      v.literal("travel_buddy")
    ),
  },
  handler: async (ctx, { origin, destination, visaType, averageDays, source }) => {
    const id = await ctx.db.insert("processingTimes", {
      origin,
      destination,
      visaType,
      averageProcessingDays: averageDays,
      source,
      lastUpdated: Date.now(),
    });

    return { _id: id, success: true };
  },
});

/**
 * Get all active corridors for weekly refresh
 */
export const getActiveCorridors = query({
  args: {},
  handler: async (ctx) => {
    // Get all corridors (limit to 30 most active)
    const corridors = await ctx.db
      .query("corridors")
      .order("desc")
      .take(30);

    return corridors.map((c) => ({
      _id: c._id,
      origin: c.origin,
      destination: c.destination,
      userId: c.userId,
    }));
  },
});

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
