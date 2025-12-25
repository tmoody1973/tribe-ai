"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { ResearchResult } from "./research";

/**
 * Background research action that runs when a corridor is created
 * This scrapes Reddit, forums, and websites to populate the RAG database
 */
export const researchCorridorBackground = internalAction({
  args: {
    corridorId: v.id("corridors"),
  },
  handler: async (ctx, { corridorId }): Promise<ResearchResult> => {
    console.log(`Starting background research for corridor: ${corridorId}`);

    try {
      // Mark corridor as refreshing
      await ctx.runMutation(internal.corridors.updateResearchStatus, {
        corridorId,
        status: "refreshing",
      });

      // Run the research action
      const result = await ctx.runAction(api.ai.research.researchCorridor, {
        corridorId,
        focusAreas: ["visa", "cost of living", "housing", "employment", "community experiences"],
      });

      console.log(`Research completed for corridor ${corridorId}:`, {
        sources: result.sources.length,
        contentStored: result.contentStored,
        toolsUsed: result.toolsUsed,
        errors: result.errors,
      });

      // Mark as fresh if successful
      if (result.contentStored > 0 || result.sources.length > 0) {
        await ctx.runMutation(internal.corridors.updateResearchStatus, {
          corridorId,
          status: "fresh",
          protocolCount: result.contentStored,
        });
      } else if (result.errors.length > 0) {
        await ctx.runMutation(internal.corridors.updateResearchStatus, {
          corridorId,
          status: "error",
          errorMessage: result.errors.join("; "),
        });
      } else {
        // No content but no errors - mark as fresh anyway
        await ctx.runMutation(internal.corridors.updateResearchStatus, {
          corridorId,
          status: "fresh",
          protocolCount: 0,
        });
      }

      return result;
    } catch (error) {
      console.error(`Research failed for corridor ${corridorId}:`, error);

      await ctx.runMutation(internal.corridors.updateResearchStatus, {
        corridorId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

interface RefreshResult {
  corridorId: Id<"corridors">;
  success: boolean;
  result?: ResearchResult;
  error?: string;
}

/**
 * Scheduled job to refresh stale corridors
 * Can be triggered via cron or manually
 */
export const refreshStaleCorridors = internalAction({
  args: {},
  handler: async (ctx): Promise<RefreshResult[]> => {
    // Get stale corridors
    const staleCorridors = await ctx.runQuery(internal.corridors.getStaleCorridors, {
      limit: 3, // Process 3 at a time to avoid rate limits
    });

    console.log(`Found ${staleCorridors.length} stale corridors to refresh`);

    const results: RefreshResult[] = [];
    for (const corridor of staleCorridors) {
      try {
        const researchResult = await ctx.runAction(api.ai.research.researchCorridor, {
          corridorId: corridor._id,
        });
        results.push({ corridorId: corridor._id, success: true, result: researchResult });
      } catch (error) {
        results.push({
          corridorId: corridor._id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Add delay between corridors to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return results;
  },
});
