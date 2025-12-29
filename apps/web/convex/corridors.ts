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

// Internal query to get all active corridors (for feed refresh)
export const getAllActive = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all corridors updated in last 30 days (active users)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const allCorridors = await ctx.db.query("corridors").collect();

    // Filter for recently active corridors
    const activeCorridors = allCorridors.filter((c) => c.updatedAt > thirtyDaysAgo);

    // Return unique origin-destination pairs
    const seen = new Set<string>();
    return activeCorridors.filter((c) => {
      const key = `${c.origin}-${c.destination}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
});

// ============================================
// MULTI-JOURNEY SUPPORT
// ============================================

// Create a new journey (corridor with name)
export const createJourney = mutation({
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
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check journey limit (max 5)
    const existingCorridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (existingCorridors.length >= 5) {
      throw new Error("Maximum 5 journeys allowed. Please archive or delete an existing journey.");
    }

    // Set all existing journeys to not primary
    for (const corridor of existingCorridors) {
      if (corridor.isPrimary) {
        await ctx.db.patch(corridor._id, { isPrimary: false });
      }
    }

    const now = Date.now();
    const corridorId = await ctx.db.insert("corridors", {
      userId: user._id,
      origin: args.origin,
      destination: args.destination,
      stage: args.stage,
      name: args.name || `Journey ${existingCorridors.length + 1}`,
      isPrimary: true, // New journey becomes primary
      createdAt: now,
      updatedAt: now,
      researchStatus: "stale",
    });

    // Schedule research
    await ctx.scheduler.runAfter(1000, internal.ai.researchScheduler.researchCorridorBackground, {
      corridorId,
    });

    return corridorId;
  },
});

// Get the primary (active) journey
export const getPrimaryJourney = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    // First try to get explicitly primary corridor
    const corridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const primary = corridors.find((c) => c.isPrimary);
    if (primary) return primary;

    // Fallback: return most recently updated (for backwards compat)
    return corridors.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  },
});

// Switch which journey is primary
export const switchPrimaryJourney = mutation({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const corridor = await ctx.db.get(corridorId);
    if (!corridor) throw new Error("Journey not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || corridor.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Set all user's corridors to not primary
    const allCorridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const c of allCorridors) {
      if (c.isPrimary) {
        await ctx.db.patch(c._id, { isPrimary: false });
      }
    }

    // Set the selected corridor as primary
    await ctx.db.patch(corridorId, {
      isPrimary: true,
      updatedAt: Date.now(),
    });

    return corridorId;
  },
});

// Rename a journey
export const renameJourney = mutation({
  args: {
    corridorId: v.id("corridors"),
    name: v.string(),
  },
  handler: async (ctx, { corridorId, name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const corridor = await ctx.db.get(corridorId);
    if (!corridor) throw new Error("Journey not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || corridor.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(corridorId, {
      name,
      updatedAt: Date.now(),
    });

    return corridorId;
  },
});

// Delete a journey (and all associated protocols)
export const deleteJourney = mutation({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const corridor = await ctx.db.get(corridorId);
    if (!corridor) throw new Error("Journey not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || corridor.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Don't allow deleting if it's the only journey
    const allCorridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (allCorridors.length <= 1) {
      throw new Error("Cannot delete your only journey. Create another journey first.");
    }

    // Delete all protocols for this corridor
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    for (const protocol of protocols) {
      await ctx.db.delete(protocol._id);
    }

    // Delete the corridor
    await ctx.db.delete(corridorId);

    // If this was primary, set another as primary
    if (corridor.isPrimary) {
      const remaining = allCorridors.filter((c) => c._id !== corridorId);
      if (remaining.length > 0) {
        await ctx.db.patch(remaining[0]._id, { isPrimary: true });
      }
    }
  },
});

// Force refresh protocols - archives old ones and triggers new research
export const forceRefreshProtocols = mutation({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const corridor = await ctx.db.get(corridorId);
    if (!corridor) throw new Error("Journey not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || corridor.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    // Archive all existing protocols for this corridor
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();

    for (const protocol of protocols) {
      await ctx.db.patch(protocol._id, {
        archived: true,
        archivedAt: now,
        archivedReason: "force_refresh",
      });
    }

    // Mark corridor as stale to trigger new research
    await ctx.db.patch(corridorId, {
      researchStatus: "stale",
      lastResearchedAt: undefined,
      protocolCount: 0,
      updatedAt: now,
    });

    // Schedule new research
    await ctx.scheduler.runAfter(500, internal.ai.researchScheduler.researchCorridorBackground, {
      corridorId,
    });

    return { archived: protocols.length };
  },
});

// Get all journeys with summary data
export const getAllJourneys = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const corridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get protocol counts for each corridor
    const journeysWithStats = await Promise.all(
      corridors.map(async (corridor) => {
        const protocols = await ctx.db
          .query("protocols")
          .withIndex("by_corridor", (q) => q.eq("corridorId", corridor._id))
          .filter((q) => q.neq(q.field("archived"), true))
          .collect();

        const completedCount = protocols.filter(
          (p) => p.status === "completed"
        ).length;

        return {
          ...corridor,
          protocolCount: protocols.length,
          completedCount,
          progress: protocols.length > 0
            ? Math.round((completedCount / protocols.length) * 100)
            : 0,
        };
      })
    );

    return journeysWithStats.sort((a, b) => {
      // Primary first, then by updated date
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return b.updatedAt - a.updatedAt;
    });
  },
});
