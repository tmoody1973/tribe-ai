import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export interface ForceRefreshResult {
  success: boolean;
  corridorId: string;
  origin: string;
  destination: string;
  protocolCount: number;
  error?: string;
}

/**
 * Force refresh a corridor's protocols
 * Bypasses freshness check and runs synchronously
 */
export const forceRefreshCorridor = action({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }): Promise<ForceRefreshResult> => {
    // Verify corridor exists
    const corridor = await ctx.runQuery(api.corridors.getCorridor, {
      id: corridorId,
    });

    if (!corridor) {
      throw new Error("Corridor not found");
    }

    console.log(`Force refreshing corridor: ${corridor.origin} → ${corridor.destination}`);

    // Log the manual refresh
    await ctx.runMutation(api.metrics.logEvent, {
      event: "manual_refresh_triggered",
      corridorId,
      metadata: { origin: corridor.origin, destination: corridor.destination },
    });

    try {
      // Run refresh immediately (blocking)
      const result = await ctx.runAction(api.ai.refresh.refreshCorridorInBackground, {
        corridorId,
      });

      return {
        success: result.success,
        corridorId: corridorId as string,
        origin: corridor.origin,
        destination: corridor.destination,
        protocolCount: result.protocolCount,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        corridorId: corridorId as string,
        origin: corridor.origin,
        destination: corridor.destination,
        protocolCount: 0,
        error: errorMessage,
      };
    }
  },
});
