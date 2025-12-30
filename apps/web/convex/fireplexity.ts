"use node";

import { v } from "convex/values";
import { query, mutation, action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Tier 2 Smart Fireplexity Integration
 *
 * Budget: 50 Fireplexity queries/month
 * Strategy: Static data first, smart live search fallback
 * Cost: ~$75/month (50 × $1.50 average)
 */

const MONTHLY_FIREPLEXITY_LIMIT = 50;

/**
 * Check if Fireplexity quota is available
 */
export const checkFireplexityQuota = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    // Get or create quota record for this month
    const quota = await ctx.db
      .query("apiQuota")
      .withIndex("by_service", (q) => q.eq("service", "fireplexity"))
      .first();

    if (!quota) {
      return {
        available: true,
        used: 0,
        limit: MONTHLY_FIREPLEXITY_LIMIT,
        remaining: MONTHLY_FIREPLEXITY_LIMIT,
        resetDate: getNextMonthStart(),
        daysUntilReset: daysUntilMonthEnd(),
      };
    }

    // Check if quota has reset (new month)
    const quotaMonth = new Date(quota.resetDate).getMonth();
    const quotaYear = new Date(quota.resetDate).getFullYear();

    if (quotaMonth !== currentMonth || quotaYear !== currentYear) {
      // New month - reset quota
      return {
        available: true,
        used: 0,
        limit: MONTHLY_FIREPLEXITY_LIMIT,
        remaining: MONTHLY_FIREPLEXITY_LIMIT,
        resetDate: getNextMonthStart(),
        daysUntilReset: daysUntilMonthEnd(),
      };
    }

    const remaining = MONTHLY_FIREPLEXITY_LIMIT - quota.callCount;

    return {
      available: remaining > 0,
      used: quota.callCount,
      limit: MONTHLY_FIREPLEXITY_LIMIT,
      remaining: Math.max(0, remaining),
      resetDate: quota.resetDate,
      daysUntilReset: daysUntilMonthEnd(),
    };
  },
});

/**
 * Increment Fireplexity usage counter
 */
export const logFireplexityUsage = mutation({
  args: {
    endpoint: v.string(),
    query: v.string(),
  },
  handler: async (ctx, { endpoint, query }) => {
    const now = Date.now();
    const currentMonth = new Date(now).getMonth();
    const currentYear = new Date(now).getFullYear();

    // Get existing quota record
    const quota = await ctx.db
      .query("apiQuota")
      .withIndex("by_service", (q) => q.eq("service", "fireplexity"))
      .first();

    if (!quota) {
      // Create new quota record
      await ctx.db.insert("apiQuota", {
        service: "fireplexity",
        endpoint,
        callCount: 1,
        resetDate: getNextMonthStart(),
        lastCallAt: now,
      });
      return { success: true, newCount: 1 };
    }

    // Check if quota has reset (new month)
    const quotaMonth = new Date(quota.resetDate).getMonth();
    const quotaYear = new Date(quota.resetDate).getFullYear();

    if (quotaMonth !== currentMonth || quotaYear !== currentYear) {
      // New month - reset counter
      await ctx.db.patch(quota._id, {
        callCount: 1,
        resetDate: getNextMonthStart(),
        lastCallAt: now,
        endpoint,
      });
      return { success: true, newCount: 1 };
    }

    // Increment counter
    const newCount = quota.callCount + 1;
    await ctx.db.patch(quota._id, {
      callCount: newCount,
      lastCallAt: now,
      endpoint,
    });

    return { success: true, newCount };
  },
});

/**
 * Execute Fireplexity search (Perplexity + Firecrawl)
 */
export const fireplexitySearch = action({
  args: {
    query: v.string(),
    targetCountry: v.optional(v.string()),
  },
  handler: async (ctx, { query, targetCountry }) => {
    // Check quota first
    const quotaStatus = await ctx.runQuery(internal.fireplexity.checkFireplexityQuota);

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
      await ctx.runMutation(internal.fireplexity.logFireplexityUsage, {
        endpoint: "fireplexity_search",
        query: fullQuery,
      });

      const newQuotaStatus = await ctx.runQuery(internal.fireplexity.checkFireplexityQuota);

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

// Helper functions

function getNextMonthStart(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.getTime();
}

function daysUntilMonthEnd(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
