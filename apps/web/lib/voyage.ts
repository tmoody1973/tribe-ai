/**
 * Voyage AI client for embedding generation
 * Uses voyage-3 model with 1024 dimensions
 */

interface VoyageEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";
export const EMBEDDING_DIMENSIONS = 1024;

/**
 * Embed a single text query
 * Uses "query" input type optimized for search queries
 */
export async function embedText(
  text: string,
  apiKey: string
): Promise<number[]> {
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY not configured");
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: text,
      input_type: "query",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage API error: ${response.status} - ${errorText}`);
  }

  const data: VoyageEmbeddingResponse = await response.json();
  return data.data[0].embedding;
}

/**
 * Embed multiple documents in batch
 * Uses "document" input type optimized for content to be searched
 * Batches in chunks of 128 (Voyage API limit)
 */
export async function embedTexts(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY not configured");
  }

  const batchSize = 128;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: batch,
        input_type: "document",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voyage API error: ${response.status} - ${errorText}`);
    }

    const data: VoyageEmbeddingResponse = await response.json();
    allEmbeddings.push(...data.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}
