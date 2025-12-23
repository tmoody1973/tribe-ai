import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    corridorId: v.optional(v.id("corridors")),
    metadata: v.optional(
      v.object({
        sources: v.optional(v.array(v.string())),
        model: v.optional(v.string()),
        tokens: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { role, content, corridorId, metadata }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    return ctx.db.insert("chatMessages", {
      userId: user._id,
      corridorId,
      role,
      content,
      metadata,
      createdAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: {
    corridorId: v.optional(v.id("corridors")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { corridorId, limit = 50 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const messagesQuery = corridorId
      ? ctx.db
          .query("chatMessages")
          .withIndex("by_user_corridor", (q) =>
            q.eq("userId", user._id).eq("corridorId", corridorId)
          )
      : ctx.db
          .query("chatMessages")
          .withIndex("by_user", (q) => q.eq("userId", user._id));

    const messages = await messagesQuery.order("desc").take(limit);
    return messages.reverse(); // Return in chronological order
  },
});

export const clearHistory = mutation({
  args: {
    corridorId: v.optional(v.id("corridors")),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const messages = corridorId
      ? await ctx.db
          .query("chatMessages")
          .withIndex("by_user_corridor", (q) =>
            q.eq("userId", user._id).eq("corridorId", corridorId)
          )
          .collect()
      : await ctx.db
          .query("chatMessages")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: messages.length };
  },
});
