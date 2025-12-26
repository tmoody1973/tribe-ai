import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const FRESHNESS_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const createProtocol = mutation({
  args: {
    corridorId: v.id("corridors"),
    category: v.union(
      v.literal("visa"),
      v.literal("finance"),
      v.literal("housing"),
      v.literal("employment"),
      v.literal("legal"),
      v.literal("health"),
      v.literal("social")
    ),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    order: v.number(),
    warnings: v.optional(v.array(v.string())),
    hacks: v.optional(v.array(v.string())),
    attribution: v.optional(
      v.object({
        authorName: v.optional(v.string()),
        sourceUrl: v.string(),
        sourceDate: v.optional(v.number()),
        engagement: v.optional(v.number()),
      })
    ),
    dueDate: v.optional(v.number()),
    aiGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("protocols", {
      corridorId: args.corridorId,
      category: args.category,
      title: args.title,
      description: args.description,
      status: "not_started",
      priority: args.priority,
      order: args.order,
      warnings: args.warnings,
      hacks: args.hacks,
      attribution: args.attribution,
      dueDate: args.dueDate,
      aiGenerated: args.aiGenerated ?? false,
    });
  },
});

export const getProtocols = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    // Only return active (non-archived) protocols by default
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();
    return protocols;
  },
});

export const getProtocolsByCategory = query({
  args: {
    corridorId: v.id("corridors"),
    category: v.union(
      v.literal("visa"),
      v.literal("finance"),
      v.literal("housing"),
      v.literal("employment"),
      v.literal("legal"),
      v.literal("health"),
      v.literal("social")
    ),
  },
  handler: async (ctx, { corridorId, category }) => {
    return await ctx.db
      .query("protocols")
      .withIndex("by_category", (q) =>
        q.eq("corridorId", corridorId).eq("category", category)
      )
      .collect();
  },
});

export const updateProtocolStatus = mutation({
  args: {
    id: v.id("protocols"),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, { id, status }) => {
    const updates: Record<string, unknown> = { status };
    if (status === "completed") {
      updates.completedAt = Date.now();
    }
    await ctx.db.patch(id, updates);
  },
});

export const updateProtocol = mutation({
  args: {
    id: v.id("protocols"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    warnings: v.optional(v.array(v.string())),
    hacks: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(id, filteredUpdates);
    }
  },
});

export const batchCreateProtocols = mutation({
  args: {
    corridorId: v.id("corridors"),
    protocols: v.array(
      v.object({
        category: v.union(
          v.literal("visa"),
          v.literal("finance"),
          v.literal("housing"),
          v.literal("employment"),
          v.literal("legal"),
          v.literal("health"),
          v.literal("social")
        ),
        title: v.string(),
        description: v.string(),
        priority: v.union(
          v.literal("critical"),
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
        order: v.number(),
        warnings: v.optional(v.array(v.string())),
        hacks: v.optional(v.array(v.string())),
        attribution: v.optional(
          v.object({
            authorName: v.optional(v.string()),
            sourceUrl: v.string(),
            sourceDate: v.optional(v.number()),
            engagement: v.optional(v.number()),
          })
        ),
      })
    ),
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
  handler: async (ctx, { corridorId, protocols, stage }) => {
    // Get corridor stage if not provided
    let generatedForStage = stage;
    if (!generatedForStage) {
      const corridor = await ctx.db.get(corridorId);
      generatedForStage = corridor?.stage;
    }

    // CRITICAL: Check for existing active protocols to prevent duplicates
    const existingProtocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();

    // If we already have protocols, skip creation to prevent duplicates
    if (existingProtocols.length > 0) {
      console.log(`Skipping batch create - ${existingProtocols.length} protocols already exist`);
      return existingProtocols.map((p) => p._id);
    }

    // Create a set of existing titles for deduplication
    const existingTitles = new Set(existingProtocols.map((p) => p.title.toLowerCase().trim()));

    const ids = [];
    for (const protocol of protocols) {
      // Skip if title already exists (case-insensitive)
      const normalizedTitle = protocol.title.toLowerCase().trim();
      if (existingTitles.has(normalizedTitle)) {
        console.log(`Skipping duplicate protocol: ${protocol.title}`);
        continue;
      }
      existingTitles.add(normalizedTitle);

      const id = await ctx.db.insert("protocols", {
        corridorId,
        category: protocol.category,
        title: protocol.title,
        description: protocol.description,
        status: "not_started",
        priority: protocol.priority,
        order: protocol.order,
        warnings: protocol.warnings,
        hacks: protocol.hacks,
        attribution: protocol.attribution,
        aiGenerated: true,
        generatedForStage,
        archived: false,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const deleteProtocol = mutation({
  args: { id: v.id("protocols") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Clean up duplicate protocols (keep first occurrence)
export const deduplicateProtocols = mutation({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();

    const seenTitles = new Map<string, string>(); // title -> first protocol id
    const duplicateIds: string[] = [];

    // Sort by order to keep the first occurrence
    protocols.sort((a, b) => a.order - b.order);

    for (const protocol of protocols) {
      const normalizedTitle = protocol.title.toLowerCase().trim();
      if (seenTitles.has(normalizedTitle)) {
        duplicateIds.push(protocol._id);
      } else {
        seenTitles.set(normalizedTitle, protocol._id);
      }
    }

    // Delete duplicates
    for (const protocol of protocols) {
      if (duplicateIds.includes(protocol._id)) {
        await ctx.db.delete(protocol._id);
      }
    }

    return { removed: duplicateIds.length, remaining: seenTitles.size };
  },
});

// Archive all protocols for a corridor (used before refresh) - SOFT DELETE
export const deleteByCorridorId = mutation({
  args: {
    corridorId: v.id("corridors"),
    hardDelete: v.optional(v.boolean()), // Only true for complete cleanup
  },
  handler: async (ctx, { corridorId, hardDelete }) => {
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true)) // Only active protocols
      .collect();

    const now = Date.now();

    if (hardDelete) {
      // Permanent deletion (rarely used)
      for (const protocol of protocols) {
        await ctx.db.delete(protocol._id);
      }
      return { deleted: protocols.length, archived: 0 };
    } else {
      // Soft delete - archive instead
      for (const protocol of protocols) {
        await ctx.db.patch(protocol._id, {
          archived: true,
          archivedAt: now,
          archivedReason: "refresh",
        });
      }
      return { deleted: 0, archived: protocols.length };
    }
  },
});

// Cache-first protocol retrieval with freshness metadata
export const getProtocolsWithFreshness = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const corridor = await ctx.db.get(corridorId);
    if (!corridor) return null;

    // Only get active (non-archived) protocols
    const allProtocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    const protocols = allProtocols.filter((p) => !p.archived);
    const archivedCount = allProtocols.filter((p) => p.archived).length;

    const lastResearchedAt = corridor.lastResearchedAt;
    const isStale = !lastResearchedAt || Date.now() - lastResearchedAt >= FRESHNESS_THRESHOLD_MS;

    return {
      protocols: protocols.sort((a, b) => a.order - b.order),
      freshness: {
        isStale,
        isFresh: !isStale,
        lastResearchedAt,
        status: corridor.researchStatus ?? "unknown",
        refreshing: corridor.researchStatus === "refreshing",
        protocolCount: protocols.length,
        archivedCount,
      },
    };
  },
});

// Action that returns cached protocols and triggers background refresh if stale
export const getProtocolsAndRefreshIfStale = action({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }): Promise<{
    protocols: Array<{
      _id: string;
      category: string;
      title: string;
      description: string;
      status: string;
      priority: string;
      order: number;
    }>;
    freshness: {
      isStale: boolean;
      isFresh: boolean;
      lastResearchedAt: number | undefined;
      status: string;
      refreshing: boolean;
      protocolCount: number;
    };
    refreshTriggered: boolean;
  }> => {
    // Get current protocols and freshness
    const result = await ctx.runQuery(api.protocols.getProtocolsWithFreshness, {
      corridorId,
    });

    if (!result) {
      throw new Error("Corridor not found");
    }

    let refreshTriggered = false;

    // If stale and not already refreshing, schedule background refresh
    if (result.freshness.isStale && !result.freshness.refreshing) {
      // Log cache miss
      await ctx.runMutation(api.metrics.logEvent, {
        event: "cache_miss",
        corridorId,
        metadata: { isStale: true },
      });

      // Schedule background refresh (non-blocking)
      await ctx.scheduler.runAfter(0, api.ai.refresh.refreshCorridorInBackground, {
        corridorId,
      });
      refreshTriggered = true;
    } else {
      // Log cache hit
      await ctx.runMutation(api.metrics.logEvent, {
        event: "cache_hit",
        corridorId,
        metadata: { isFresh: !result.freshness.isStale },
      });
    }

    // Return cached data immediately
    return {
      ...result,
      refreshTriggered,
    };
  },
});
