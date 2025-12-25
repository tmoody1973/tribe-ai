import { Agent } from "@mastra/core";
import { firecrawlTool } from "./tools/firecrawl";
import { tavilyTool } from "./tools/tavily";
import { redditTool } from "./tools/reddit";
import { perplexityTool } from "./tools/perplexity";

const CORRIDOR_RESEARCH_INSTRUCTIONS = `You are a migration research specialist for TRIBE - The Diaspora Intelligence Network.

Your role is to gather accurate, up-to-date information about migration pathways (corridors).

When researching a corridor (origin → destination):

1. OFFICIAL SOURCES FIRST
   - Check government immigration websites (embassy, visa portals)
   - Look for recent policy changes (last 6 months)
   - Verify visa requirements and processing times

2. COMMUNITY EXPERIENCES
   - Search Reddit for real experiences (r/IWantOut, r/expats, country subs)
   - Find forum discussions (InterNations, Expatica)
   - Look for recent blog posts from migrants

3. PRACTICAL INFORMATION
   - Cost of living comparisons
   - Housing market insights
   - Job market for foreigners
   - Banking and financial setup

4. QUALITY STANDARDS
   - Always cite your sources with URLs
   - Prioritize recent content (< 1 year old)
   - Flag any conflicting information
   - Note the author/username when available

Output structured research that can be synthesized into actionable protocols.

Your tools:
- tavily_search: Search the web for migration-related content
- reddit_search: Search Reddit communities for experiences
- firecrawl_scrape: Scrape specific webpages for detailed content
- perplexity_query: Get real-time policy information with citations

Always start with a broad search, then dive deeper into specific sources.`;

export const corridorResearcher = new Agent({
  name: "CorridorResearcher",
  instructions: CORRIDOR_RESEARCH_INSTRUCTIONS,
  model: "google/gemini-2.5-flash",
  tools: {
    tavily_search: tavilyTool,
    reddit_search: redditTool,
    firecrawl_scrape: firecrawlTool,
    perplexity_query: perplexityTool,
  },
});

export interface ResearchContext {
  origin: string;
  destination: string;
  stage?: string;
  focusAreas?: string[];
}

export function buildResearchQuery(context: ResearchContext): string {
  const { origin, destination, stage, focusAreas } = context;

  let query = `Research migration from ${origin} to ${destination}.`;

  if (stage) {
    query += ` The user is in the "${stage}" stage of their migration journey.`;
  }

  if (focusAreas && focusAreas.length > 0) {
    query += ` Focus especially on: ${focusAreas.join(", ")}.`;
  } else {
    query += ` Focus on visa requirements, cost of living, housing, employment, and community experiences.`;
  }

  query += ` Gather information from official sources, Reddit communities, and relevant forums.`;

  return query;
}
