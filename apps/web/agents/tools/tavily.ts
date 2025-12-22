import { createTool } from "@mastra/core";
import { tavily } from "@tavily/core";
import { z } from "zod";

let tavilyClient: ReturnType<typeof tavily> | null = null;

function getTavily() {
  if (!tavilyClient) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY not configured");
    }
    tavilyClient = tavily({ apiKey });
  }
  return tavilyClient;
}

export interface TavilyResult {
  answer?: string;
  results: {
    title: string;
    url: string;
    snippet: string;
    score: number;
  }[];
  error?: string;
}

export const tavilyTool = createTool({
  id: "tavily_search",
  description:
    "Search the web for immigration and migration information. Returns relevant URLs and snippets.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Search query about migration, visas, or relocation"),
    maxResults: z.number().default(5).describe("Maximum number of results"),
  }),
  execute: async ({ context }) => {
    const { query, maxResults } = context;
    try {
      const client = getTavily();
      const response = await client.search(query, {
        maxResults: maxResults ?? 5,
        searchDepth: "advanced",
        includeAnswer: true,
      });

      return {
        answer: response.answer,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          score: r.score,
        })),
      } satisfies TavilyResult;
    } catch (error) {
      return {
        results: [],
        error: `Tavily error: ${error instanceof Error ? error.message : String(error)}`,
      } satisfies TavilyResult;
    }
  },
});
