"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";
const EMBEDDING_DIMENSIONS = 1024;
const MAX_CHUNK_CHARS = 2000; // ~500 tokens

/**
 * Generate embeddings using Voyage AI
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY not configured");
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

/**
 * Generate a single embedding for a query (for vector search)
 */
export const generateQueryEmbedding = action({
  args: { query: v.string() },
  handler: async (_, { query }): Promise<number[]> => {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) {
      throw new Error("VOYAGE_API_KEY not configured");
    }

    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: [query],
        model: VOYAGE_MODEL,
        input_type: "query",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voyage AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  },
});

/**
 * Chunk content into smaller pieces for embedding
 */
function chunkContent(content: string, maxLength: number = MAX_CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  const paragraphs = content.split(/\n\n+/);

  let currentChunk = "";
  for (const para of paragraphs) {
    // If a single paragraph is too long, split it by sentences
    if (para.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      const sentences = para.split(/(?<=[.!?])\s+/);
      let sentenceChunk = "";
      for (const sentence of sentences) {
        if (sentenceChunk.length + sentence.length > maxLength) {
          if (sentenceChunk) chunks.push(sentenceChunk.trim());
          sentenceChunk = sentence;
        } else {
          sentenceChunk += " " + sentence;
        }
      }
      if (sentenceChunk) chunks.push(sentenceChunk.trim());
    } else if (currentChunk.length + para.length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks.filter((c) => c.length > 50); // Skip very short chunks
}

export interface StoreContentResult {
  stored: boolean;
  existingId?: string;
  reason?: string;
  ids?: string[];
  chunks?: number;
}

/**
 * Store content with embeddings in the IngestedContent table
 */
export const storeContentWithEmbedding = action({
  args: {
    corridorId: v.id("corridors"),
    url: v.string(),
    title: v.string(),
    content: v.string(),
    source: v.union(
      v.literal("reddit"),
      v.literal("forum"),
      v.literal("blog"),
      v.literal("government"),
      v.literal("news")
    ),
    metadata: v.optional(
      v.object({
        author: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
        subreddit: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { corridorId, url, title, content, source, metadata }): Promise<StoreContentResult> => {
    // Check if already stored
    const existing = await ctx.runQuery(api.ingestedContent.getContentByUrl, { url });
    if (existing) {
      console.log(`Content already exists for URL: ${url}`);
      return { stored: false, existingId: existing._id };
    }

    // Chunk content
    const chunks = chunkContent(content);

    if (chunks.length === 0) {
      console.log(`No valid chunks for URL: ${url}`);
      return { stored: false, reason: "No valid content chunks" };
    }

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // Store each chunk
    const storedIds = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkUrl = chunks.length > 1 ? `${url}#chunk-${i}` : url;
      const chunkTitle = chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title;

      const id = await ctx.runMutation(api.ingestedContent.storeContent, {
        corridorId,
        url: chunkUrl,
        title: chunkTitle,
        content: chunks[i],
        embedding: embeddings[i],
        source,
        metadata: metadata ?? {},
        expiresInDays: 30,
      });

      storedIds.push(id);
    }

    return { stored: true, ids: storedIds, chunks: chunks.length };
  },
});

export interface UpdateEmbeddingsResult {
  updated: number;
  total: number;
}

/**
 * Batch update embeddings for existing content
 */
export const updateContentEmbeddings = action({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }): Promise<UpdateEmbeddingsResult> => {
    const content = await ctx.runQuery(api.ingestedContent.getContentByCorridor, {
      corridorId,
    });

    let updated = 0;
    for (const item of content) {
      // Skip if already has embedding
      if (item.embedding && item.embedding.length === EMBEDDING_DIMENSIONS) {
        continue;
      }

      try {
        const [embedding] = await generateEmbeddings([item.content]);
        await ctx.runMutation(api.ingestedContent.updateEmbedding, {
          id: item._id,
          embedding,
        });
        updated++;
      } catch (error) {
        console.error(`Failed to update embedding for ${item._id}:`, error);
      }
    }

    return { updated, total: content.length };
  },
});
