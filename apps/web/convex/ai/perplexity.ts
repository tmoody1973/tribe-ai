"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { searchPerplexity } from "../../lib/perplexity";

interface PerplexityResult {
  answer: string;
  sources: Array<{
    url: string;
    type: "perplexity";
  }>;
  rateLimited: boolean;
  remainingRequests: number;
}

/**
 * Search Perplexity for real-time information with rate limiting
 */
export const searchRealtime = action({
  args: {
    query: v.string(),
    corridorId: v.optional(v.id("corridors")),
    userId: v.string(),
  },
  handler: async (ctx, { query, corridorId, userId }): Promise<PerplexityResult> => {
    const startTime = Date.now();

    // Check rate limit
    const rateCheck = await ctx.runQuery(internal.rateLimits.checkRateLimit, {
      userId,
      action: "perplexity_search",
    });

    if (!rateCheck.allowed) {
      console.log(
        `Rate limited user ${userId}, ${rateCheck.remaining} requests remaining`
      );
      return {
        answer: "",
        sources: [],
        rateLimited: true,
        remainingRequests: 0,
      };
    }

    // Get corridor for context
    let corridorContext: { origin?: string; destination?: string } | undefined;
    if (corridorId) {
      const corridor = await ctx.runQuery(api.corridors.getCorridor, {
        id: corridorId,
      });
      if (corridor) {
        corridorContext = {
          origin: corridor.origin,
          destination: corridor.destination,
        };
      }
    }

    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY not configured");
      }

      const result = await searchPerplexity(query, apiKey, corridorContext);

      // Increment rate limit counter
      await ctx.runMutation(internal.rateLimits.incrementRateLimit, {
        userId,
        action: "perplexity_search",
      });

      // Log usage for cost tracking
      await ctx.runMutation(api.monitoring.logTokenUsage, {
        model: "perplexity-sonar",
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        action: "perplexity_search",
        corridorId,
      });

      const latency = Date.now() - startTime;
      console.log(
        `Perplexity search completed in ${latency}ms, ${result.citations.length} citations`
      );

      return {
        answer: result.answer,
        sources: result.citations.map((url) => ({
          url,
          type: "perplexity" as const,
        })),
        rateLimited: false,
        remainingRequests: rateCheck.remaining - 1,
      };
    } catch (error) {
      console.error("Perplexity search error:", error);
      throw error;
    }
  },
});
