// @ts-nocheck - Circular type references with internal API
"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Weekly Cron Job: Auto-refresh visa data for active corridors
 *
 * Strategy:
 * - Refreshes top 30 most active corridors
 * - Budget: 120 API calls/month → 30 corridors × 4 weeks = 120 calls
 * - Runs every Sunday at 2 AM UTC
 * - Respects quota limits with graceful fallback
 */
// @ts-ignore: Type circular reference workaround
export const refreshActiveCorridorVisaData = internalAction({
  handler: async (ctx) => {
    console.log("🔄 Starting weekly visa data refresh...");

    // Get top 30 active corridors
    const corridors = await ctx.runQuery(internal.visaQueries.getActiveCorridors);

    console.log(`📋 Found ${corridors.length} active corridors to refresh`);

    // Check quota first
    const quotaStatus = await ctx.runMutation(internal.visaQueries.checkTravelBuddyQuota);

    console.log(
      `📊 Travel Buddy API Quota: ${quotaStatus.used}/${quotaStatus.limit} used, ${quotaStatus.remaining} remaining`
    );

    if (!quotaStatus.available) {
      console.log(
        `⚠️ Quota exceeded. Skipping refresh. Quota resets in ${quotaStatus.daysUntilReset} days.`
      );
      return {
        success: false,
        message: "Quota exceeded",
        quotaStatus,
      };
    }

    // Limit refresh to quota available
    const maxRefresh = Math.min(corridors.length, quotaStatus.remaining);
    const corridorsToRefresh = corridors.slice(0, maxRefresh);

    console.log(`🎯 Refreshing ${corridorsToRefresh.length} corridors (quota limit: ${maxRefresh})`);

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const corridor of corridorsToRefresh) {
      try {
        console.log(`  → Refreshing ${corridor.origin} → ${corridor.destination}...`);

        const result = await ctx.runAction(internal.visaDiscovery.getVisaRequirementsForCorridor, {
          origin: corridor.origin,
          destination: corridor.destination,
          forceRefresh: true, // Force API call even if cache is valid
        });

        if (result.error) {
          console.log(`    ❌ Failed: ${result.message}`);
          failureCount++;
          errors.push(`${corridor.origin}→${corridor.destination}: ${result.message}`);
        } else {
          console.log(
            `    ✅ Success (${result.cached ? "from cache" : "fresh data"}, quota remaining: ${result.quotaRemaining})`
          );
          successCount++;
        }

        // Add delay between calls to avoid rate limiting (100ms)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`    ❌ Exception: ${String(error)}`);
        failureCount++;
        errors.push(`${corridor.origin}→${corridor.destination}: ${String(error)}`);
      }
    }

    const summary = {
      success: true,
      totalCorridors: corridors.length,
      refreshed: corridorsToRefresh.length,
      successCount,
      failureCount,
      quotaRemaining: quotaStatus.remaining - successCount,
      errors: errors.slice(0, 10), // Limit error list
    };

    console.log(`\n✅ Visa refresh complete:`);
    console.log(`   - Total corridors: ${summary.totalCorridors}`);
    console.log(`   - Refreshed: ${summary.refreshed}`);
    console.log(`   - Success: ${summary.successCount}`);
    console.log(`   - Failed: ${summary.failureCount}`);
    console.log(`   - Quota remaining: ${summary.quotaRemaining}\n`);

    return summary;
  },
});

/**
 * Manual trigger for testing visa data refresh
 * Can be called from Convex dashboard
 */
// @ts-ignore: Type circular reference workaround
export const manualVisaRefresh = internalAction({
  handler: async (ctx) => {
    console.log("🔧 Manual visa refresh triggered");
    return await ctx.runAction(internal.visaRefreshScheduler.refreshActiveCorridorVisaData);
  },
});
