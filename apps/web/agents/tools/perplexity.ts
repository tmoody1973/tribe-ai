import { createTool } from "@mastra/core";
import { z } from "zod";

export interface PerplexityResult {
  answer: string;
  citations: string[];
  error?: string;
}

export const perplexityTool = createTool({
  id: "perplexity_query",
  description:
    "Query Perplexity for real-time policy information and current immigration rules.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Question about current immigration policies or rules"),
  }),
  execute: async ({ context }) => {
    const { query } = context;
    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        return {
          answer: "",
          citations: [],
          error: "PERPLEXITY_API_KEY not configured",
        } satisfies PerplexityResult;
      }

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that provides accurate, current immigration policy information with citations. Focus on official sources and recent policy changes.",
            },
            { role: "user", content: query },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        answer: data.choices?.[0]?.message?.content ?? "",
        citations: data.citations ?? [],
      } satisfies PerplexityResult;
    } catch (error) {
      return {
        answer: "",
        citations: [],
        error: `Perplexity error: ${error instanceof Error ? error.message : String(error)}`,
      } satisfies PerplexityResult;
    }
  },
});
