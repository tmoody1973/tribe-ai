import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// ARCHIVE OPERATIONS - Automatic stage-based archiving
// ============================================

const stageType = v.union(
  v.literal("dreaming"),
  v.literal("planning"),
  v.literal("preparing"),
  v.literal("relocating"),
  v.literal("settling")
);

/**
 * Archive all active protocols for a corridor when stage changes
 * This preserves the user's progress history
 */
export const archiveProtocolsForStageChange = mutation({
  args: {
    corridorId: v.id("corridors"),
    previousStage: stageType,
    newStage: stageType,
  },
  handler: async (ctx, { corridorId, previousStage, newStage }) => {
    // Get all non-archived protocols for this corridor
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();

    const now = Date.now();
    let archivedCount = 0;

    for (const protocol of protocols) {
      await ctx.db.patch(protocol._id, {
        archived: true,
        archivedAt: now,
        archivedReason: `Stage changed from ${previousStage} to ${newStage}`,
        generatedForStage: protocol.generatedForStage ?? previousStage,
      });
      archivedCount++;
    }

    return { archivedCount, previousStage, newStage };
  },
});

/**
 * Get archived protocols organized by stage
 */
export const getArchivedProtocols = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_archived", (q) =>
        q.eq("corridorId", corridorId).eq("archived", true)
      )
      .collect();

    // Group by stage
    const byStage: Record<string, typeof protocols> = {};
    for (const protocol of protocols) {
      const stage = protocol.generatedForStage ?? "unknown";
      if (!byStage[stage]) {
        byStage[stage] = [];
      }
      byStage[stage].push(protocol);
    }

    // Sort each stage's protocols by order
    for (const stage of Object.keys(byStage)) {
      byStage[stage].sort((a, b) => a.order - b.order);
    }

    return {
      byStage,
      totalArchived: protocols.length,
      stages: Object.keys(byStage),
    };
  },
});

/**
 * Get active (non-archived) protocols only
 */
export const getActiveProtocols = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const protocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();

    return protocols.sort((a, b) => a.order - b.order);
  },
});

/**
 * Restore an archived protocol back to active
 */
export const restoreProtocol = mutation({
  args: { protocolId: v.id("protocols") },
  handler: async (ctx, { protocolId }) => {
    await ctx.db.patch(protocolId, {
      archived: false,
      archivedAt: undefined,
      archivedReason: undefined,
    });
    return { restored: true };
  },
});

// ============================================
// SAVE OPERATIONS - User-controlled bookmarks
// ============================================

/**
 * Save a protocol to user's personal collection with optional notes
 */
export const saveProtocol = mutation({
  args: {
    protocolId: v.id("protocols"),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { protocolId, notes, tags }) => {
    // Get the protocol
    const protocol = await ctx.db.get(protocolId);
    if (!protocol) {
      throw new Error("Protocol not found");
    }

    // Get the corridor to find the user
    const corridor = await ctx.db.get(protocol.corridorId);
    if (!corridor) {
      throw new Error("Corridor not found");
    }

    // Check if already saved
    const existing = await ctx.db
      .query("savedProtocols")
      .withIndex("by_original", (q) => q.eq("originalProtocolId", protocolId))
      .first();

    if (existing) {
      // Update existing save
      await ctx.db.patch(existing._id, {
        notes,
        tags,
        updatedAt: Date.now(),
      });
      return { savedId: existing._id, updated: true };
    }

    // Create snapshot of protocol data
    const savedId = await ctx.db.insert("savedProtocols", {
      userId: corridor.userId,
      corridorId: protocol.corridorId,
      originalProtocolId: protocolId,
      snapshot: {
        category: protocol.category,
        title: protocol.title,
        description: protocol.description,
        priority: protocol.priority,
        status: protocol.status,
        warnings: protocol.warnings,
        hacks: protocol.hacks,
        generatedForStage: protocol.generatedForStage,
      },
      notes,
      tags,
      savedAt: Date.now(),
    });

    return { savedId, updated: false };
  },
});

/**
 * Remove a protocol from saved collection
 */
export const unsaveProtocol = mutation({
  args: { protocolId: v.id("protocols") },
  handler: async (ctx, { protocolId }) => {
    const saved = await ctx.db
      .query("savedProtocols")
      .withIndex("by_original", (q) => q.eq("originalProtocolId", protocolId))
      .first();

    if (saved) {
      await ctx.db.delete(saved._id);
      return { removed: true };
    }
    return { removed: false };
  },
});

/**
 * Remove a saved protocol by its own ID
 */
export const deleteSavedProtocol = mutation({
  args: { savedProtocolId: v.id("savedProtocols") },
  handler: async (ctx, { savedProtocolId }) => {
    await ctx.db.delete(savedProtocolId);
    return { removed: true };
  },
});

/**
 * Update notes on a saved protocol
 */
export const updateSavedProtocolNotes = mutation({
  args: {
    savedProtocolId: v.id("savedProtocols"),
    notes: v.string(),
  },
  handler: async (ctx, { savedProtocolId, notes }) => {
    await ctx.db.patch(savedProtocolId, {
      notes,
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});

/**
 * Get all saved protocols for a user
 */
export const getSavedProtocols = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const saved = await ctx.db
      .query("savedProtocols")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by saved date, most recent first
    return saved.sort((a, b) => b.savedAt - a.savedAt);
  },
});

/**
 * Get saved protocols for a specific corridor
 */
export const getSavedProtocolsByCorridor = query({
  args: {
    userId: v.id("users"),
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { userId, corridorId }) => {
    const saved = await ctx.db
      .query("savedProtocols")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", userId).eq("corridorId", corridorId)
      )
      .collect();

    return saved.sort((a, b) => b.savedAt - a.savedAt);
  },
});

/**
 * Check if a protocol is saved
 */
export const isProtocolSaved = query({
  args: { protocolId: v.id("protocols") },
  handler: async (ctx, { protocolId }) => {
    const saved = await ctx.db
      .query("savedProtocols")
      .withIndex("by_original", (q) => q.eq("originalProtocolId", protocolId))
      .first();

    return { isSaved: !!saved, savedId: saved?._id };
  },
});

/**
 * Get saved status for multiple protocols at once (batch)
 */
export const getSavedStatusBatch = query({
  args: { protocolIds: v.array(v.id("protocols")) },
  handler: async (ctx, { protocolIds }) => {
    const results: Record<string, { isSaved: boolean; savedId?: string }> = {};

    for (const protocolId of protocolIds) {
      const saved = await ctx.db
        .query("savedProtocols")
        .withIndex("by_original", (q) => q.eq("originalProtocolId", protocolId))
        .first();

      results[protocolId] = {
        isSaved: !!saved,
        savedId: saved?._id,
      };
    }

    return results;
  },
});

// ============================================
// MIGRATION JOURNEY STATS
// ============================================

/**
 * Get comprehensive journey stats including archived protocols
 */
export const getJourneyStats = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    // Get all protocols (active and archived)
    const allProtocols = await ctx.db
      .query("protocols")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    const active = allProtocols.filter((p) => !p.archived);
    const archived = allProtocols.filter((p) => p.archived);

    // Calculate stats
    const activeCompleted = active.filter((p) => p.status === "completed").length;
    const archivedCompleted = archived.filter((p) => p.status === "completed").length;

    // Get unique stages from archived
    const stageSet = new Set(archived.map((p) => p.generatedForStage).filter(Boolean));
    const archivedStages = Array.from(stageSet);

    return {
      active: {
        total: active.length,
        completed: activeCompleted,
        inProgress: active.filter((p) => p.status === "in_progress").length,
        notStarted: active.filter((p) => p.status === "not_started").length,
        completionRate: active.length > 0 ? Math.round((activeCompleted / active.length) * 100) : 0,
      },
      archived: {
        total: archived.length,
        completed: archivedCompleted,
        stages: archivedStages,
        completionRate: archived.length > 0 ? Math.round((archivedCompleted / archived.length) * 100) : 0,
      },
      overall: {
        total: allProtocols.length,
        completed: activeCompleted + archivedCompleted,
        completionRate: allProtocols.length > 0
          ? Math.round(((activeCompleted + archivedCompleted) / allProtocols.length) * 100)
          : 0,
      },
    };
  },
});
