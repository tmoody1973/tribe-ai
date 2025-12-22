import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logEvent = mutation({
  args: {
    event: v.string(),
    corridorId: v.optional(v.id("corridors")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { event, corridorId, metadata }) => {
    await ctx.db.insert("metrics", {
      event,
      corridorId,
      metadata,
      createdAt: Date.now(),
    });
  },
});

export const getCacheMetrics = query({
  args: { since: v.optional(v.number()) },
  handler: async (ctx, { since }) => {
    const cutoff = since ?? Date.now() - 24 * 60 * 60 * 1000; // Last 24h

    const allMetrics = await ctx.db.query("metrics").collect();
    const recent = allMetrics.filter((m) => m.createdAt >= cutoff);

    const hits = recent.filter((m) => m.event === "cache_hit").length;
    const misses = recent.filter((m) => m.event === "cache_miss").length;
    const refreshes = recent.filter((m) => m.event === "corridor_refreshed").length;
    const errors = recent.filter((m) => m.event === "corridor_refresh_error").length;

    return {
      cacheHits: hits,
      cacheMisses: misses,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
      refreshes,
      errors,
      period: "24h",
    };
  },
});

export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),
    event: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, event }) => {
    let query = ctx.db.query("metrics");

    if (event) {
      query = query.withIndex("by_event", (q) => q.eq("event", event));
    }

    const events = await query.collect();

    return events
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});
