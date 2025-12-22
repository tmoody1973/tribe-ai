"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";

// Explicit return type to avoid circular reference errors
export interface PipelineResult {
  protocolIds: string[];
  cached: boolean;
  sourcesUsed?: number;
  contentStored?: number;
  errors: string[];
}

/**
 * Full pipeline to generate protocols for a corridor
 * Chains: research → synthesis → storage
 */
export const generateCorridorProtocols = action({
  args: {
    corridorId: v.id("corridors"),
    targetLanguage: v.optional(v.string()),
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { corridorId, targetLanguage = "en", forceRefresh = false }
  ): Promise<PipelineResult> => {
    const errors: string[] = [];

    // Get corridor details first
    const corridor = await ctx.runQuery(api.corridors.getCorridor, {
      id: corridorId,
    });

    if (!corridor) {
      throw new Error("Corridor not found");
    }

    console.log(`Starting pipeline for ${corridor.origin} → ${corridor.destination}`);

    // Check if protocols already exist
    if (!forceRefresh) {
      const existing = await ctx.runQuery(api.protocols.getProtocols, {
        corridorId,
      });

      if (existing.length > 0) {
        console.log(`Found ${existing.length} existing protocols, returning cached`);
        return {
          protocolIds: existing.map((p: Doc<"protocols">) => p._id),
          cached: true,
          errors: [],
        };
      }
    }

    // Step 1: Research
    console.log("Step 1: Starting corridor research...");
    let researchResult;
    try {
      researchResult = await ctx.runAction(api.ai.research.researchCorridor, {
        corridorId,
      });
      console.log(
        `Research complete: ${researchResult.sources.length} sources, ${researchResult.contentStored} content items stored`
      );

      if (researchResult.errors.length > 0) {
        errors.push(...researchResult.errors.map((e: string) => `Research: ${e}`));
      }
    } catch (error) {
      const errorMsg = `Research failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);

      // Check if we have existing content to work with
      const existingContent = await ctx.runQuery(
        api.ingestedContent.getContentByCorridor,
        { corridorId }
      );

      if (existingContent.length === 0) {
        return {
          protocolIds: [],
          cached: false,
          sourcesUsed: 0,
          contentStored: 0,
          errors,
        };
      }

      console.log(`Using ${existingContent.length} existing content items for synthesis`);
      researchResult = {
        sources: existingContent.map((c: Doc<"ingestedContent">) => c.url),
        contentStored: existingContent.length,
        errors: [] as string[],
      };
    }

    // Step 2: Synthesize
    console.log("Step 2: Synthesizing protocols...");
    let synthesisResult;
    try {
      synthesisResult = await ctx.runAction(api.ai.synthesis.synthesizeProtocols, {
        corridorId,
        targetLanguage,
      });
      console.log(`Synthesis complete: ${synthesisResult.count} protocols created`);

      if (synthesisResult.errors.length > 0) {
        errors.push(...synthesisResult.errors.map((e: string) => `Synthesis: ${e}`));
      }
    } catch (error) {
      const errorMsg = `Synthesis failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      return {
        protocolIds: [],
        cached: false,
        sourcesUsed: researchResult.sources.length,
        contentStored: researchResult.contentStored,
        errors,
      };
    }

    console.log("Pipeline complete!");

    return {
      protocolIds: synthesisResult.protocolIds,
      cached: false,
      sourcesUsed: researchResult.sources.length,
      contentStored: researchResult.contentStored,
      errors,
    };
  },
});

/**
 * Refresh protocols for a corridor
 * Deletes existing AI-generated protocols and regenerates
 */
export const refreshCorridorProtocols = action({
  args: {
    corridorId: v.id("corridors"),
    targetLanguage: v.optional(v.string()),
    refreshResearch: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { corridorId, targetLanguage = "en", refreshResearch = false }
  ): Promise<PipelineResult> => {
    const errors: string[] = [];

    // Get existing protocols
    const existing = await ctx.runQuery(api.protocols.getProtocols, {
      corridorId,
    });

    // Delete existing AI-generated protocols
    console.log(`Deleting ${existing.filter((p: Doc<"protocols">) => p.aiGenerated).length} existing AI-generated protocols`);
    for (const protocol of existing) {
      if (protocol.aiGenerated) {
        await ctx.runMutation(api.protocols.deleteProtocol, {
          id: protocol._id,
        });
      }
    }

    // Optionally refresh research content
    if (refreshResearch) {
      // Delete expired content
      await ctx.runMutation(api.ingestedContent.deleteExpiredContent, {});

      // Run fresh research
      return await ctx.runAction(api.ai.pipeline.generateCorridorProtocols, {
        corridorId,
        targetLanguage,
        forceRefresh: true,
      });
    }

    // Just re-synthesize from existing content
    try {
      const synthesisResult = await ctx.runAction(api.ai.synthesis.synthesizeProtocols, {
        corridorId,
        targetLanguage,
      });

      if (synthesisResult.errors.length > 0) {
        errors.push(...synthesisResult.errors);
      }

      return {
        protocolIds: synthesisResult.protocolIds,
        cached: false,
        errors,
      };
    } catch (error) {
      const errorMsg = `Synthesis failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      return {
        protocolIds: [],
        cached: false,
        errors,
      };
    }
  },
});

export interface PipelineStatus {
  corridor: {
    origin: string;
    destination: string;
    stage: string;
  } | null;
  hasProtocols: boolean;
  protocolCount: number;
  aiGeneratedCount: number;
  hasResearchContent: boolean;
  contentCount: number;
  lastContentScraped: number | null;
}

/**
 * Get pipeline status for a corridor
 */
export const getPipelineStatus = action({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }): Promise<PipelineStatus> => {
    const [corridor, protocols, content] = await Promise.all([
      ctx.runQuery(api.corridors.getCorridor, { id: corridorId }),
      ctx.runQuery(api.protocols.getProtocols, { corridorId }),
      ctx.runQuery(api.ingestedContent.getContentByCorridor, { corridorId }),
    ]);

    return {
      corridor: corridor
        ? {
            origin: corridor.origin,
            destination: corridor.destination,
            stage: corridor.stage,
          }
        : null,
      hasProtocols: protocols.length > 0,
      protocolCount: protocols.length,
      aiGeneratedCount: protocols.filter((p: Doc<"protocols">) => p.aiGenerated).length,
      hasResearchContent: content.length > 0,
      contentCount: content.length,
      lastContentScraped:
        content.length > 0
          ? Math.max(...content.map((c: Doc<"ingestedContent">) => c.scrapedAt))
          : null,
    };
  },
});
