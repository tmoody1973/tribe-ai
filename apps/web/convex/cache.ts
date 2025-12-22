import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const cached = await ctx.db
      .query("apiCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!cached) return null;

    return {
      data: cached.data,
      cachedAt: cached.cachedAt,
      expired: Date.now() > cached.expiresAt,
    };
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    data: v.any(),
    ttlMs: v.number(),
  },
  handler: async (ctx, { key, data, ttlMs }) => {
    // Delete existing entry
    const existing = await ctx.db
      .query("apiCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new entry
    const now = Date.now();
    await ctx.db.insert("apiCache", {
      key,
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
    });
  },
});

export const deleteExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("apiCache")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    return expired.length;
  },
});
