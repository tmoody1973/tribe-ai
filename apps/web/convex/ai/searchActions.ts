"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

interface SearchResult {
  id: Id<"ingestedContent">;
  content: string;
  title: string;
  score: number;
  metadata: {
    url: string;
    author: string | undefined;
    publishedAt: number | undefined;
    subreddit: string | undefined;
    corridorId: Id<"corridors">;
  };
  isCorridorSpecific: boolean;
}

/**
 * Search for relevant content using vector similarity
 * Includes fallback to global search if corridor-specific results are insufficient
 */
export const searchRelevantContent = action({
  args: {
    query: v.string(),
    corridorId: v.optional(v.id("corridors")),
    limit: v.optional(v.number()),
    minResults: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { query, corridorId, limit = 10, minResults = 3 }
  ): Promise<SearchResult[]> => {
    const startTime = Date.now();

    // Step 1: Embed the query
    const queryEmbedding = await ctx.runAction(
      api.ai.embeddings.generateQueryEmbedding,
      { query }
    );

    const embeddingTime = Date.now() - startTime;
    console.log(`Query embedded in ${embeddingTime}ms`);

    // Step 2: Search with corridor filter using vectorSearch
    let searchResults = await ctx.vectorSearch("ingestedContent", "by_embedding", {
      vector: queryEmbedding,
      limit: limit,
      filter: corridorId
        ? (q) => q.eq("corridorId", corridorId)
        : undefined,
    });

    const searchTime = Date.now() - startTime - embeddingTime;
    console.log(
      `Corridor search completed in ${searchTime}ms, ${searchResults.length} results`
    );

    let allCorridorSpecific = true;

    // Step 3: Fallback to broader search if needed
    if (searchResults.length < minResults && corridorId) {
      console.log(
        `Only ${searchResults.length} corridor-specific results, falling back to global search`
      );

      const globalResults = await ctx.vectorSearch("ingestedContent", "by_embedding", {
        vector: queryEmbedding,
        limit: limit,
      });

      // Merge results, prioritizing corridor-specific
      const corridorIds = new Set(searchResults.map((r) => r._id));
      const additionalResults = globalResults.filter(
        (r) => !corridorIds.has(r._id)
      );

      // Combine corridor-specific and global results
      searchResults = [
        ...searchResults,
        ...additionalResults.slice(0, limit - searchResults.length),
      ];
      allCorridorSpecific = false;
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `Search completed in ${totalTime}ms, ${searchResults.length} total results`
    );

    // Get full content for results
    const contentIds = searchResults.map((r) => r._id);
    const contents = await ctx.runQuery(internal.ai.search.getContentByIds, {
      ids: contentIds,
    }) as Array<{
      _id: Id<"ingestedContent">;
      content: string;
      title: string;
      url: string;
      metadata: {
        author?: string;
        publishedAt?: number;
        subreddit?: string;
      };
      corridorId: Id<"corridors">;
    }>;

    // Create a map for quick lookup
    const contentMap = new Map(contents.map((c) => [c._id, c]));
    const corridorResultIds = new Set(
      searchResults.slice(0, corridorId ? searchResults.length : 0).map((r) => r._id)
    );

    // Format results with metadata
    return searchResults
      .map((r) => {
        const content = contentMap.get(r._id);
        if (!content) return null;

        return {
          id: r._id,
          content: content.content,
          title: content.title,
          score: r._score,
          metadata: {
            url: content.url,
            author: content.metadata?.author,
            publishedAt: content.metadata?.publishedAt,
            subreddit: content.metadata?.subreddit,
            corridorId: content.corridorId,
          },
          isCorridorSpecific: allCorridorSpecific || corridorResultIds.has(r._id),
        };
      })
      .filter((r): r is SearchResult => r !== null);
  },
});

/**
 * Get similar content to a given document
 * Useful for "related content" suggestions
 */
export const getSimilarContent = action({
  args: {
    contentId: v.id("ingestedContent"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { contentId, limit = 5 }): Promise<SearchResult[]> => {
    // Get the original content
    const targetContent = await ctx.runQuery(internal.ai.search.getContentById, {
      id: contentId,
    });

    if (!targetContent?.embedding) {
      console.log("Content has no embedding");
      return [];
    }

    // Search for similar content
    const searchResults = await ctx.vectorSearch("ingestedContent", "by_embedding", {
      vector: targetContent.embedding,
      limit: limit + 1, // Get one extra to account for self
      filter: (q) => q.eq("corridorId", targetContent.corridorId),
    });

    // Get full content for results (excluding the original)
    const filteredResults = searchResults.filter((r) => r._id !== contentId);
    const contentIds = filteredResults.slice(0, limit).map((r) => r._id);
    const contents = await ctx.runQuery(internal.ai.search.getContentByIds, {
      ids: contentIds,
    }) as Array<{
      _id: Id<"ingestedContent">;
      content: string;
      title: string;
      url: string;
      metadata: {
        author?: string;
        publishedAt?: number;
        subreddit?: string;
      };
      corridorId: Id<"corridors">;
    }>;

    // Create a map for quick lookup
    const contentMap = new Map(contents.map((c) => [c._id, c]));

    // Format results
    return filteredResults
      .slice(0, limit)
      .map((r) => {
        const content = contentMap.get(r._id);
        if (!content) return null;

        return {
          id: r._id,
          content: content.content,
          title: content.title,
          score: r._score,
          metadata: {
            url: content.url,
            author: content.metadata?.author,
            publishedAt: content.metadata?.publishedAt,
            subreddit: content.metadata?.subreddit,
            corridorId: content.corridorId,
          },
          isCorridorSpecific: true,
        };
      })
      .filter((r): r is SearchResult => r !== null);
  },
});
