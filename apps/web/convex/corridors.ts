import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const FRESHNESS_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    const corridorId = await ctx.db.insert("corridors", {
      userId: user._id,
      origin: args.origin,
      destination: args.destination,
      stage: args.stage,
      createdAt: now,
      updatedAt: now,
      researchStatus: "stale", // Mark as needing research
    });

    // Schedule research to run after corridor creation (delayed by 1 second)
    await ctx.scheduler.runAfter(1000, internal.ai.researchScheduler.researchCorridorBackground, {
      corridorId,
    });

    return corridorId;
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

// Freshness check query
export const checkFreshness = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const corridor = await ctx.db.get(corridorId);
    if (!corridor) return null;

    const lastResearchedAt = corridor.lastResearchedAt;
    const isFresh = lastResearchedAt
      ? Date.now() - lastResearchedAt < FRESHNESS_THRESHOLD_MS
      : false;

    return {
      corridorId,
      isFresh,
      isStale: !isFresh,
      lastResearchedAt,
      status: corridor.researchStatus ?? (isFresh ? "fresh" : "stale"),
      protocolCount: corridor.protocolCount ?? 0,
      errorMessage: corridor.errorMessage,
    };
  },
});

// Internal mutation for updating research status
export const updateResearchStatus = internalMutation({
  args: {
    corridorId: v.id("corridors"),
    status: v.union(
      v.literal("fresh"),
      v.literal("stale"),
      v.literal("refreshing"),
      v.literal("error")
    ),
    protocolCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { corridorId, status, protocolCount, errorMessage }) => {
    const updates: Record<string, unknown> = {
      researchStatus: status,
      updatedAt: Date.now(),
    };

    if (status === "fresh") {
      updates.lastResearchedAt = Date.now();
    }
    if (protocolCount !== undefined) {
      updates.protocolCount = protocolCount;
    }
    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage;
    }

    await ctx.db.patch(corridorId, updates);
  },
});

// Internal query to get stale corridors for scheduled refresh
export const getStaleCorridors = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    const now = Date.now();
    const cutoff = now - FRESHNESS_THRESHOLD_MS;

    // Get all corridors and filter for stale ones
    const allCorridors = await ctx.db.query("corridors").collect();

    const staleCorridors = allCorridors.filter((c) => {
      // Skip if already refreshing
      if (c.researchStatus === "refreshing") return false;
      // Include if never researched or stale
      if (!c.lastResearchedAt) return true;
      return c.lastResearchedAt < cutoff;
    });

    // Sort by oldest first and limit
    return staleCorridors
      .sort((a, b) => (a.lastResearchedAt ?? 0) - (b.lastResearchedAt ?? 0))
      .slice(0, limit);
  },
});
