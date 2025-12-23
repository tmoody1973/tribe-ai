import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get content by ID
 */
export const getContentById = internalQuery({
  args: { id: v.id("ingestedContent") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Internal query to get multiple content items by IDs
 */
export const getContentByIds = internalQuery({
  args: { ids: v.array(v.id("ingestedContent")) },
  handler: async (ctx, { ids }) => {
    const results = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return results.filter((r) => r !== null);
  },
});
