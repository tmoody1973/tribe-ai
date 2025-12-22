import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeContent = mutation({
  args: {
    corridorId: v.id("corridors"),
    url: v.string(),
    title: v.string(),
    content: v.string(),
    embedding: v.optional(v.array(v.float64())),
    source: v.union(
      v.literal("reddit"),
      v.literal("forum"),
      v.literal("blog"),
      v.literal("government"),
      v.literal("news")
    ),
    metadata: v.object({
      author: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      subreddit: v.optional(v.string()),
    }),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysToExpire = args.expiresInDays ?? 30;
    const expiresAt = now + daysToExpire * 24 * 60 * 60 * 1000;

    // Check if content with this URL already exists
    const existing = await ctx.db
      .query("ingestedContent")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .unique();

    if (existing) {
      // Update existing content
      await ctx.db.patch(existing._id, {
        title: args.title,
        content: args.content,
        embedding: args.embedding,
        metadata: args.metadata,
        scrapedAt: now,
        expiresAt,
      });
      return existing._id;
    }

    // Insert new content
    return await ctx.db.insert("ingestedContent", {
      corridorId: args.corridorId,
      url: args.url,
      title: args.title,
      content: args.content,
      embedding: args.embedding,
      source: args.source,
      metadata: args.metadata,
      scrapedAt: now,
      expiresAt,
    });
  },
});

export const getContentByCorridor = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    return await ctx.db
      .query("ingestedContent")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();
  },
});

export const getContentByUrl = query({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    return await ctx.db
      .query("ingestedContent")
      .withIndex("by_url", (q) => q.eq("url", url))
      .unique();
  },
});

export const getExpiredContent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("ingestedContent")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
  },
});

export const deleteExpiredContent = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("ingestedContent")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const content of expired) {
      await ctx.db.delete(content._id);
    }

    return expired.length;
  },
});

export const deleteContent = mutation({
  args: { id: v.id("ingestedContent") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const updateEmbedding = mutation({
  args: {
    id: v.id("ingestedContent"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, { id, embedding }) => {
    await ctx.db.patch(id, { embedding });
  },
});

// Note: Vector search requires using vectorSearch from convex/server
// This will be implemented properly in Story 2.3 with the RAG pipeline
// For now, we provide a simple corridor-based content retrieval
export const getRecentContent = query({
  args: {
    corridorId: v.id("corridors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { corridorId, limit }) => {
    const results = await ctx.db
      .query("ingestedContent")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .order("desc")
      .take(limit ?? 10);

    return results;
  },
});
