import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCorridor = mutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    stage: v.union(
      v.literal("dreaming"),
      v.literal("planning"),
      v.literal("preparing"),
      v.literal("relocating"),
      v.literal("settling")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    return await ctx.db.insert("corridors", {
      userId: user._id,
      origin: args.origin,
      destination: args.destination,
      stage: args.stage,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getCorridor = query({
  args: { id: v.id("corridors") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getUserCorridors = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getActiveCorridor = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    // Return most recently updated corridor
    const corridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return corridors.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  },
});

export const updateCorridor = mutation({
  args: {
    id: v.id("corridors"),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    stage: v.optional(
      v.union(
        v.literal("dreaming"),
        v.literal("planning"),
        v.literal("preparing"),
        v.literal("relocating"),
        v.literal("settling")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const corridor = await ctx.db.get(args.id);
    if (!corridor) throw new Error("Corridor not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || corridor.userId !== user._id) {
      throw new Error("Not authorized");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.origin !== undefined) updates.origin = args.origin;
    if (args.destination !== undefined) updates.destination = args.destination;
    if (args.stage !== undefined) updates.stage = args.stage;

    await ctx.db.patch(args.id, updates);
  },
});
