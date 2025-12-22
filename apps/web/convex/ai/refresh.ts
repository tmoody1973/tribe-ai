"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

export interface RefreshResult {
  success: boolean;
  protocolCount: number;
  error?: string;
}

/**
 * Background refresh action for a corridor
 * Runs the full research + synthesis pipeline
 */
export const refreshCorridorInBackground = action({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }): Promise<RefreshResult> => {
    // Set status to refreshing
    await ctx.runMutation(internal.corridors.updateResearchStatus, {
      corridorId,
      status: "refreshing",
    });

    try {
      // Delete existing protocols (will be regenerated)
      await ctx.runMutation(api.protocols.deleteByCorridorId, { corridorId });

      // Run full pipeline
      const result = await ctx.runAction(api.ai.pipeline.generateCorridorProtocols, {
        corridorId,
        forceRefresh: true,
      });

      // Update status to fresh
      await ctx.runMutation(internal.corridors.updateResearchStatus, {
        corridorId,
        status: "fresh",
        protocolCount: result.protocolIds.length,
      });

      // Log metric
      await ctx.runMutation(api.metrics.logEvent, {
        event: "corridor_refreshed",
        corridorId,
        metadata: { protocolCount: result.protocolIds.length },
      });

      return { success: true, protocolCount: result.protocolIds.length };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update status to error
      await ctx.runMutation(internal.corridors.updateResearchStatus, {
        corridorId,
        status: "error",
        errorMessage,
      });

      // Log error metric
      await ctx.runMutation(api.metrics.logEvent, {
        event: "corridor_refresh_error",
        corridorId,
        metadata: { error: errorMessage },
      });

      return { success: false, protocolCount: 0, error: errorMessage };
    }
  },
});
