import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mark a protocol step as complete
 */
export const markComplete = mutation({
  args: {
    protocolId: v.id("protocols"),
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { protocolId, corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if already completed
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .filter((q) => q.eq(q.field("protocolId"), protocolId))
      .first();

    if (existing) return existing._id;

    return ctx.db.insert("userProgress", {
      userId: user._id,
      corridorId,
      protocolId,
      completedAt: Date.now(),
    });
  },
});

/**
 * Mark a protocol step as incomplete (remove completion)
 */
export const markIncomplete = mutation({
  args: {
    protocolId: v.id("protocols"),
  },
  handler: async (ctx, { protocolId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_protocol", (q) => q.eq("protocolId", protocolId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (progress) {
      await ctx.db.delete(progress._id);
    }
  },
});

/**
 * Get all progress for a corridor
 */
export const getProgress = query({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return ctx.db
      .query("userProgress")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();
  },
});

/**
 * Get progress stats for a corridor
 */
export const getProgressStats = query({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { completed: 0, total: 0, percentage: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return { completed: 0, total: 0, percentage: 0 };

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    const completed = progress.length;
    const total = protocols.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  },
});

/**
 * Reset all progress for a corridor
 */
export const resetProgress = mutation({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const progressItems = await ctx.db
      .query("userProgress")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    for (const item of progressItems) {
      await ctx.db.delete(item._id);
    }

    return { deleted: progressItems.length };
  },
});
