import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Internal query for use by other Convex functions
export const getRequirementInternal = internalQuery({
  args: { origin: v.string(), destination: v.string() },
  handler: async (ctx, { origin, destination }) => {
    return await ctx.db
      .query("passportIndex")
      .withIndex("by_corridor", (q) =>
        q.eq("origin", origin.toUpperCase()).eq("destination", destination.toUpperCase())
      )
      .unique();
  },
});

export const insert = mutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    requirement: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("passportIndex", {
      origin: args.origin.toUpperCase(),
      destination: args.destination.toUpperCase(),
      requirement: args.requirement,
    });
  },
});

export const batchInsert = mutation({
  args: {
    entries: v.array(
      v.object({
        origin: v.string(),
        destination: v.string(),
        requirement: v.string(),
      })
    ),
  },
  handler: async (ctx, { entries }) => {
    const ids = [];
    for (const entry of entries) {
      const id = await ctx.db.insert("passportIndex", {
        origin: entry.origin.toUpperCase(),
        destination: entry.destination.toUpperCase(),
        requirement: entry.requirement,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const getRequirement = query({
  args: { origin: v.string(), destination: v.string() },
  handler: async (ctx, { origin, destination }) => {
    return await ctx.db
      .query("passportIndex")
      .withIndex("by_corridor", (q) =>
        q.eq("origin", origin.toUpperCase()).eq("destination", destination.toUpperCase())
      )
      .unique();
  },
});

export const getByOrigin = query({
  args: { origin: v.string() },
  handler: async (ctx, { origin }) => {
    return await ctx.db
      .query("passportIndex")
      .withIndex("by_origin", (q) => q.eq("origin", origin.toUpperCase()))
      .collect();
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("passportIndex").collect();
    for (const entry of all) {
      await ctx.db.delete(entry._id);
    }
    return all.length;
  },
});
