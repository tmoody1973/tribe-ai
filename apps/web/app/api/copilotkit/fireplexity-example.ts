/**
 * EXAMPLE: Fireplexity Integration with CopilotKit
 *
 * This demonstrates how to add Fireplexity as a CopilotKit action
 * with smart cost management and fallback strategies
 */

import { CopilotRuntime } from "@copilotkit/runtime";

// Hypothetical Fireplexity client
async function fireplexitySearch(query: string) {
  // 1. Perplexity search for context
  const perplexityResults = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: query }],
    }),
  });

  const perplexityData = await perplexityResults.json();

  // 2. Extract URLs from Perplexity citations
  const urlsToScrape = perplexityData.citations?.slice(0, 3) || [];

  // 3. Firecrawl scrapes those URLs
  const scrapeResults = await Promise.all(
    urlsToScrape.map(async (url: string) => {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
        }),
      });
      return response.json();
    })
  );

  return {
    answer: perplexityData.choices[0].message.content,
    sources: urlsToScrape,
    scrapedData: scrapeResults,
  };
}

// Add to CopilotKit runtime
export const fireplexityAction = {
  name: "searchLiveData",
  description:
    "Search live web data for up-to-date migration resources, visa updates, housing info, and job opportunities. Only use when user explicitly requests current/latest data or when static data is insufficient.",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "The search query for live data",
      required: true,
    },
    {
      name: "targetCountry",
      type: "string",
      description: "The destination country to focus the search",
      required: false,
    },
  ],
  handler: async ({ query, targetCountry }: any) => {
    // Rate limit check
    const usageThisMonth = await checkFireplexityUsage();
    if (usageThisMonth >= 50) {
      return {
        error: true,
        message:
          "⚠️ Live search quota exceeded this month. Showing cached data instead. Quota resets in " +
          daysUntilMonthEnd() +
          " days.",
      };
    }

    try {
      const fullQuery = targetCountry ? `${query} in ${targetCountry}` : query;
      const results = await fireplexitySearch(fullQuery);

      // Log usage
      await logFireplexityUsage();

      return {
        answer: results.answer,
        sources: results.sources,
        dataFreshness: "Real-time (scraped just now)",
        usageRemaining: 50 - usageThisMonth - 1,
      };
    } catch (error) {
      return {
        error: true,
        message: "❌ Live search failed. Falling back to cached data.",
      };
    }
  },
};

// Helper functions
async function checkFireplexityUsage(): Promise<number> {
  // Query apiQuota table for "fireplexity" service
  // Return number of calls this month
  return 0; // Placeholder
}

async function logFireplexityUsage() {
  // Increment counter in apiQuota table
}

function daysUntilMonthEnd(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * SMART UX PATTERN
 *
 * User: "Are there housing programs in Berlin?"
 *
 * AI Response:
 * "I found 3 resources in my database:
 * 1. Berlin Housing Solutions (Government-Supported NGO)
 * 2. Refugees Welcome Berlin (NGO)
 * 3. Berlin Welcomes You (Online Platform)
 *
 * 🔍 Want me to search for the latest programs?
 * [Search Live Data Button] (Uses 1 of 50 monthly searches)"
 *
 * User clicks → Fireplexity runs → Returns fresh data
 */
