import { internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const CONTENT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Clean up expired ingested content
 */
export const cleanupExpiredContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - CONTENT_EXPIRY_MS;

    // Find old ingested content
    const allContent = await ctx.db.query("ingestedContent").collect();
    const expired = allContent.filter((c) => c.scrapedAt < cutoff);

    // Delete expired entries
    for (const content of expired) {
      await ctx.db.delete(content._id);
    }

    console.log(`Cleaned up ${expired.length} expired content entries`);
    return { deleted: expired.length };
  },
});

/**
 * Pre-emptively refresh stale corridors
 */
export const refreshStaleCorridors = internalAction({
  args: {},
  handler: async (ctx): Promise<{ found: number; refreshed: number }> => {
    // Find corridors that are stale
    const corridors = await ctx.runQuery(internal.corridors.getStaleCorridors, {
      limit: 5, // Limit to prevent overload
    });

    console.log(`Found ${corridors.length} stale corridors to refresh`);

    let refreshed = 0;
    for (const corridor of corridors) {
      try {
        await ctx.runAction(api.ai.refresh.refreshCorridorInBackground, {
          corridorId: corridor._id,
        });
        refreshed++;
      } catch (error) {
        console.error(`Failed to refresh corridor ${corridor._id}:`, error);
      }
    }

    return { found: corridors.length, refreshed };
  },
});

/**
 * Clean up old metrics (keep last 30 days)
 */
export const cleanupOldMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days

    const allMetrics = await ctx.db.query("metrics").collect();
    const old = allMetrics.filter((m) => m.createdAt < cutoff);

    for (const metric of old) {
      await ctx.db.delete(metric._id);
    }

    console.log(`Cleaned up ${old.length} old metrics entries`);
    return { deleted: old.length };
  },
});
