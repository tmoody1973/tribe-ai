"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { corridorResearcher, buildResearchQuery } from "../../agents/corridorResearcher";

export interface ResearchResult {
  response: string;
  sources: string[];
  toolsUsed: string[];
  contentStored: number;
  errors: string[];
}

/**
 * Detect source type from URL
 */
function detectSource(url: string): "reddit" | "forum" | "blog" | "government" | "news" {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("reddit.com")) return "reddit";

  if (
    lowerUrl.includes("nairaland") ||
    lowerUrl.includes("internations") ||
    lowerUrl.includes("expatica") ||
    lowerUrl.includes("forum")
  ) {
    return "forum";
  }

  if (
    lowerUrl.includes(".gov") ||
    lowerUrl.includes("embassy") ||
    lowerUrl.includes("uscis") ||
    lowerUrl.includes("immigration") ||
    lowerUrl.includes("visa") ||
    lowerUrl.includes("consulate")
  ) {
    return "government";
  }

  if (
    lowerUrl.includes("news") ||
    lowerUrl.includes("bbc") ||
    lowerUrl.includes("cnn") ||
    lowerUrl.includes("reuters")
  ) {
    return "news";
  }

  return "blog";
}

/**
 * Research a corridor using the AI agent
 */
export const researchCorridor = action({
  args: {
    corridorId: v.id("corridors"),
    query: v.optional(v.string()),
    focusAreas: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { corridorId, query, focusAreas }): Promise<ResearchResult> => {
    const errors: string[] = [];

    // Get corridor details
    const corridor = await ctx.runQuery(api.corridors.getCorridor, {
      id: corridorId,
    });

    if (!corridor) {
      throw new Error("Corridor not found");
    }

    // Build research query
    const researchQuery =
      query ??
      buildResearchQuery({
        origin: corridor.origin,
        destination: corridor.destination,
        stage: corridor.stage,
        focusAreas,
      });

    console.log(`Starting research for corridor ${corridor.origin} → ${corridor.destination}`);

    // Execute Mastra agent
    let result;
    try {
      result = await corridorResearcher.generate(researchQuery, {
        maxSteps: 10, // Allow up to 10 tool calls
      });
    } catch (error) {
      errors.push(`Agent execution error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        response: "",
        sources: [],
        toolsUsed: [],
        contentStored: 0,
        errors,
      };
    }

    // Extract sources and tool usage
    const sources: string[] = [];
    const toolsUsed: string[] = [];
    let contentStored = 0;

    // Process tool results and store scraped content
    if (result.toolResults) {
      for (const toolResult of result.toolResults) {
        const payload = toolResult.payload;
        const toolName = payload?.toolName ?? "unknown";
        toolsUsed.push(toolName);

        // Handle Firecrawl results - store scraped content
        if (toolName === "firecrawl_scrape") {
          const scrapeResult = payload?.result as {
            url?: string;
            title?: string;
            content?: string;
            error?: string;
          } | null;

          if (scrapeResult?.url && scrapeResult.content && !scrapeResult.error) {
            sources.push(scrapeResult.url);

            try {
              const storeResult = await ctx.runAction(api.ai.embeddings.storeContentWithEmbedding, {
                corridorId,
                url: scrapeResult.url,
                title: scrapeResult.title ?? "Untitled",
                content: scrapeResult.content,
                source: detectSource(scrapeResult.url),
              });

              if (storeResult.stored) {
                contentStored += storeResult.chunks ?? 1;
              }
            } catch (storeError) {
              errors.push(
                `Failed to store content from ${scrapeResult.url}: ${storeError instanceof Error ? storeError.message : String(storeError)}`
              );
            }
          }
        }

        // Extract URLs from Tavily results
        if (toolName === "tavily_search") {
          const tavilyResult = payload?.result as { results?: { url: string }[] } | null;
          if (tavilyResult?.results) {
            sources.push(...tavilyResult.results.map((r) => r.url));
          }
        }

        // Extract URLs from Reddit results
        if (toolName === "reddit_search") {
          const redditResult = payload?.result as { posts?: { url: string }[] } | null;
          if (redditResult?.posts) {
            sources.push(...redditResult.posts.map((p) => p.url));
          }
        }
      }
    }

    return {
      response: result.text ?? "",
      sources: Array.from(new Set(sources)), // Dedupe
      toolsUsed: Array.from(new Set(toolsUsed)),
      contentStored,
      errors,
    };
  },
});

/**
 * Quick research without full agent execution
 * Uses Tavily for fast web search
 */
export const quickSearch = action({
  args: {
    query: v.string(),
    maxResults: v.optional(v.number()),
  },
  handler: async (_, { query, maxResults }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { error: "TAVILY_API_KEY not configured", results: [] };
    }

    try {
      const { tavily } = await import("@tavily/core");
      const client = tavily({ apiKey });

      const response = await client.search(query, {
        maxResults: maxResults ?? 5,
        searchDepth: "basic",
        includeAnswer: true,
      });

      return {
        answer: response.answer,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        })),
      };
    } catch (error) {
      return {
        error: `Search error: ${error instanceof Error ? error.message : String(error)}`,
        results: [],
      };
    }
  },
});
