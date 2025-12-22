import { createTool } from "@mastra/core";
import { z } from "zod";

export interface RedditPost {
  title: string;
  selftext: string;
  author: string;
  url: string;
  score: number;
  numComments: number;
  createdAt: string;
  subreddit: string;
}

export interface RedditResult {
  posts: RedditPost[];
  error?: string;
}

export const redditTool = createTool({
  id: "reddit_search",
  description:
    "Search Reddit for migration experiences and advice. Targets expat and immigration subreddits.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    subreddits: z
      .array(z.string())
      .default(["IWantOut", "expats", "immigration"])
      .describe("Subreddits to search"),
    limit: z.number().default(10).describe("Maximum posts per subreddit"),
  }),
  execute: async ({ context }) => {
    const { query, subreddits, limit } = context;
    try {
      const results: RedditPost[] = [];
      const subs = subreddits ?? ["IWantOut", "expats", "immigration"];
      const postLimit = limit ?? 10;

      for (const subreddit of subs) {
        try {
          const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=${postLimit}&sort=relevance`;

          const response = await fetch(url, {
            headers: {
              "User-Agent": "TRIBE/1.0 (Diaspora Intelligence Network)",
            },
          });

          if (!response.ok) {
            console.warn(`Reddit API error for r/${subreddit}: ${response.status}`);
            continue;
          }

          const data = await response.json();

          if (!data.data?.children) continue;

          const posts = data.data.children.map((child: Record<string, Record<string, unknown>>) => ({
            title: child.data.title as string,
            selftext: ((child.data.selftext as string) ?? "").slice(0, 500),
            author: child.data.author as string,
            url: `https://reddit.com${child.data.permalink}`,
            score: child.data.score as number,
            numComments: child.data.num_comments as number,
            createdAt: new Date((child.data.created_utc as number) * 1000).toISOString(),
            subreddit: child.data.subreddit as string,
          }));

          results.push(...posts);
        } catch (subredditError) {
          console.warn(`Error fetching r/${subreddit}:`, subredditError);
        }

        // Small delay between subreddit requests
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return {
        posts: results.slice(0, postLimit * subs.length),
      } satisfies RedditResult;
    } catch (error) {
      return {
        posts: [],
        error: `Reddit error: ${error instanceof Error ? error.message : String(error)}`,
      } satisfies RedditResult;
    }
  },
});
