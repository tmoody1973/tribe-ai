"use node";

import { v } from "convex/values";
import { action, query, mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  getVisaMap,
  checkVisaRequirements,
  getPassportRank,
  hasQuotaAvailable,
} from "../lib/api/travel-buddy";

/**
 * Story 9.13: Travel Buddy API - Visa Pathway Discovery
 *
 * Features:
 * 1. Visa Discovery Actions - Call Travel Buddy API with 7-day caching
 * 2. Quota Management - 120 requests/month free tier
 * 3. Processing Times - Perplexity API for real-time data
 * 4. Weekly Cron - Auto-refresh visa data for active corridors
 */

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const FREE_TIER_LIMIT = 120;

/**
 * Get visa requirements for a corridor (origin → destination)
 * Uses 7-day cache to minimize API calls
 */
export const getVisaRequirementsForCorridor = action({
  args: {
    origin: v.string(), // ISO 3166-1 alpha-3 code (e.g., "NGA", "IND")
    destination: v.string(), // ISO 3166-1 alpha-3 code (e.g., "CAN", "USA")
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, { origin, destination, forceRefresh = false }) => {
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await ctx.runQuery(internal.visaQueries.getCachedVisaRequirements, {
        origin,
        destination,
      });

      if (cached && cached.expiresAt > now) {
        return {
          ...cached,
          cached: true,
          cacheExpiresIn: Math.ceil((cached.expiresAt - now) / (1000 * 60 * 60 * 24)), // days
        };
      }
    }

    // Check quota
    const quotaStatus = await ctx.runMutation(internal.visaQueries.checkTravelBuddyQuota);

    if (!quotaStatus.available) {
      // Return cached data even if expired
      const cached = await ctx.runQuery(internal.visaQueries.getCachedVisaRequirements, {
        origin,
        destination,
      });

      if (cached) {
        return {
          ...cached,
          cached: true,
          expired: true,
          quotaExceeded: true,
          message: `⚠️ API quota exceeded (${quotaStatus.used}/${quotaStatus.limit}). Showing cached data. Quota resets in ${quotaStatus.daysUntilReset} days.`,
        };
      }

      return {
        error: true,
        message: `❌ No cached data available and API quota exceeded. Quota resets in ${quotaStatus.daysUntilReset} days.`,
        quotaStatus,
      };
    }

    try {
      // Call Travel Buddy API
      const visaData = await checkVisaRequirements(origin, destination);

      // Log API usage
      await ctx.runMutation(internal.visaQueries.logTravelBuddyUsage, {
        endpoint: "visa_check",
      });

      // Cache the result
      const cachedData = await ctx.runMutation(internal.visaQueries.cacheVisaRequirements, {
        origin,
        destination,
        visaData,
      });

      return {
        ...cachedData,
        cached: false,
        quotaRemaining: quotaStatus.remaining - 1,
      };
    } catch (error) {
      // On error, try to return cached data
      const cached = await ctx.runQuery(internal.visaQueries.getCachedVisaRequirements, {
        origin,
        destination,
      });

      if (cached) {
        return {
          ...cached,
          cached: true,
          expired: cached.expiresAt < now,
          error: true,
          message: `⚠️ API call failed. Showing cached data. Error: ${String(error)}`,
        };
      }

      return {
        error: true,
        message: `❌ Failed to fetch visa requirements: ${String(error)}`,
      };
    }
  },
});

/**
 * Get full visa map for a passport (all 210 destinations)
 * Expensive call - use sparingly
 */
export const getVisaMapForPassport = action({
  args: {
    passport: v.string(), // ISO 3166-1 alpha-3 code
  },
  handler: async (ctx, { passport }) => {
    // Check quota
    const quotaStatus = await ctx.runMutation(internal.visaQueries.checkTravelBuddyQuota);

    if (!quotaStatus.available) {
      return {
        error: true,
        message: `⚠️ API quota exceeded (${quotaStatus.used}/${quotaStatus.limit}). Quota resets in ${quotaStatus.daysUntilReset} days.`,
        quotaStatus,
      };
    }

    try {
      const visaMap = await getVisaMap(passport);

      // Log API usage
      await ctx.runMutation(internal.visaQueries.logTravelBuddyUsage, {
        endpoint: "visa_map",
      });

      return {
        success: true,
        passport,
        destinations: visaMap.destinations,
        visaFreeCount: visaMap.visaFreeCount,
        visaOnArrivalCount: visaMap.visaOnArrivalCount,
        visaRequiredCount: visaMap.visaRequiredCount,
        difficultyScore: visaMap.difficultyScore,
        quotaRemaining: quotaStatus.remaining - 1,
      };
    } catch (error) {
      return {
        error: true,
        message: `❌ Failed to fetch visa map: ${String(error)}`,
      };
    }
  },
});

/**
 * Get passport difficulty ranking
 */
export const getPassportDifficulty = action({
  args: {
    passport: v.string(),
  },
  handler: async (ctx, { passport }) => {
    // Check quota
    const quotaStatus = await ctx.runMutation(internal.visaQueries.checkTravelBuddyQuota);

    if (!quotaStatus.available) {
      return {
        error: true,
        message: `⚠️ API quota exceeded. Quota resets in ${quotaStatus.daysUntilReset} days.`,
      };
    }

    try {
      const rank = await getPassportRank(passport);

      // Log API usage
      await ctx.runMutation(internal.visaQueries.logTravelBuddyUsage, {
        endpoint: "passport_rank",
      });

      return {
        success: true,
        ...rank,
        quotaRemaining: quotaStatus.remaining - 1,
      };
    } catch (error) {
      return {
        error: true,
        message: `❌ Failed to fetch passport rank: ${String(error)}`,
      };
    }
  },
});

/**
 * Get processing times for a visa application
 * Uses Perplexity API for real-time data
 */
export const getProcessingTimes = action({
  args: {
    origin: v.string(),
    destination: v.string(),
    visaType: v.string(),
  },
  handler: async (ctx, { origin, destination, visaType }) => {
    // Check cache first
    const cached = await ctx.runQuery(internal.visaQueries.getCachedProcessingTimes, {
      origin,
      destination,
      visaType,
    });

    const now = Date.now();
    const PROCESSING_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (cached && cached.lastUpdated > now - PROCESSING_CACHE_DURATION) {
      return {
        ...cached,
        cached: true,
        cacheAge: Math.ceil((now - cached.lastUpdated) / (1000 * 60 * 60 * 24)), // days
      };
    }

    // Use Perplexity API for real-time data
    try {
      const query = `What is the current average processing time for a ${visaType} visa from ${origin} to ${destination} in 2025? Provide the answer in days.`;

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
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

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "";

      // Extract days from answer (simple regex)
      const daysMatch = answer.match(/(\d+)\s*(?:to\s*(\d+)\s*)?days?/i);
      const averageDays = daysMatch
        ? daysMatch[2]
          ? Math.round((parseInt(daysMatch[1]) + parseInt(daysMatch[2])) / 2)
          : parseInt(daysMatch[1])
        : 30; // default to 30 days if can't parse

      // Cache the result
      await ctx.runMutation(internal.visaQueries.cacheProcessingTimes, {
        origin,
        destination,
        visaType,
        averageDays,
        source: "perplexity",
      });

      return {
        success: true,
        origin,
        destination,
        visaType,
        averageProcessingDays: averageDays,
        source: "perplexity",
        rawAnswer: answer,
        cached: false,
      };
    } catch (error) {
      // Fallback to cached data if available
      if (cached) {
        return {
          ...cached,
          cached: true,
          expired: true,
          error: true,
          message: `⚠️ API call failed. Showing cached data. Error: ${String(error)}`,
        };
      }

      return {
        error: true,
        message: `❌ Failed to fetch processing times: ${String(error)}`,
      };
    }
  },
});

