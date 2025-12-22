import { createTool } from "@mastra/core";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

let firecrawlClient: FirecrawlApp | null = null;

function getFirecrawl(): FirecrawlApp {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }
    firecrawlClient = new FirecrawlApp({ apiKey });
  }
  return firecrawlClient;
}

export interface FirecrawlResult {
  url: string;
  title: string;
  content: string;
  scrapedAt: string;
  error?: string;
}

export const firecrawlTool = createTool({
  id: "firecrawl_scrape",
  description:
    "Scrape a webpage and extract its content as markdown. Use for forums, blogs, and government sites.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to scrape"),
    waitForSelector: z
      .string()
      .optional()
      .describe("CSS selector to wait for (for JS-rendered pages)"),
  }),
  execute: async ({ context }) => {
    const { url, waitForSelector } = context;
    try {
      const firecrawl = getFirecrawl();
      const result = await firecrawl.scrape(url, {
        formats: ["markdown"],
      });

      return {
        url,
        title: result.metadata?.title ?? "",
        content: result.markdown ?? "",
        scrapedAt: new Date().toISOString(),
      } satisfies FirecrawlResult;
    } catch (error) {
      return {
        url,
        title: "",
        content: "",
        scrapedAt: new Date().toISOString(),
        error: `Firecrawl error: ${error instanceof Error ? error.message : String(error)}`,
      } satisfies FirecrawlResult;
    }
  },
});
