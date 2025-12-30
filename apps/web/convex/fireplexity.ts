"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Tier 2 Smart Fireplexity Integration - Actions Only
 *
 * Budget: 50 Fireplexity queries/month
 * Strategy: Static data first, smart live search fallback
 * Cost: ~$75/month (50 × $1.50 average)
 */

// Type definitions for Fireplexity search results
interface QuotaStatus {
  available: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetDate: number;
  daysUntilReset: number;
}

interface ScrapeResult {
  url: string;
  markdown?: string;
  title?: string;
  error?: string;
}

interface FireplexitySearchResult {
  error?: boolean;
  message?: string;
  success?: boolean;
  answer?: string;
  sources?: string[];
  scrapedData?: ScrapeResult[];
  dataFreshness?: string;
  quotaStatus?: QuotaStatus;
}

/**
 * Execute Fireplexity search (Perplexity + Firecrawl)
 */
export const fireplexitySearch = action({
  args: {
    query: v.string(),
    targetCountry: v.optional(v.string()),
  },
  handler: async (ctx, { query, targetCountry }): Promise<FireplexitySearchResult> => {
    // Check quota first
    const quotaStatus = await ctx.runQuery(api.fireplexityQueries.checkFireplexityQuota);

    if (!quotaStatus.available) {
      return {
        error: true,
        message: `⚠️ Live search quota exceeded this month (${quotaStatus.used}/${quotaStatus.limit} used). Quota resets in ${quotaStatus.daysUntilReset} days.`,
        quotaStatus,
      };
    }

    const fullQuery = targetCountry ? `${query} in ${targetCountry}` : query;

    try {
      // Step 1: Perplexity search for context
      const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "user",
              content: fullQuery,
            },
          ],
        }),
      });

      if (!perplexityResponse.ok) {
        throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
      }

      const perplexityData = await perplexityResponse.json();
      const answer = perplexityData.choices?.[0]?.message?.content || "";
      const citations = perplexityData.citations || [];

      // Step 2: Extract top 3 URLs to scrape
      const urlsToScrape = citations.slice(0, 3);

      // Step 3: Firecrawl scrapes those URLs
      const scrapeResults = await Promise.all(
        urlsToScrape.map(async (url: string) => {
          try {
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

            if (!response.ok) {
              return { url, error: `Scrape failed: ${response.status}` };
            }

            const data = await response.json();
            return {
              url,
              markdown: data.markdown || "",
              title: data.metadata?.title || "",
            };
          } catch (error) {
            return { url, error: String(error) };
          }
        })
      );

      // Log usage
      await ctx.runMutation(internal.fireplexityQueries.logFireplexityUsage, {
        endpoint: "fireplexity_search",
        query: fullQuery,
      });

      const newQuotaStatus = await ctx.runQuery(api.fireplexityQueries.checkFireplexityQuota);

      return {
        success: true,
        answer,
        sources: urlsToScrape,
        scrapedData: scrapeResults,
        dataFreshness: "Real-time (scraped just now)",
        quotaStatus: newQuotaStatus,
      };
    } catch (error) {
      return {
        error: true,
        message: `❌ Live search failed: ${String(error)}. Falling back to cached data.`,
      };
    }
  },
});
