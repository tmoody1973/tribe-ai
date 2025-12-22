"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export interface CostComparison {
  originCity: string;
  destinationCity: string;
  rentIndex: number;
  groceriesIndex: number;
  transportIndex: number;
  utilitiesIndex: number;
  overallIndex: number;
  // Percentage difference (positive = destination is more expensive)
  difference: number;
  stale?: boolean;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Static fallback data for common corridors
// Based on approximate Numbeo data as of 2024
const FALLBACK_DATA: Record<string, CostComparison> = {
  "NG:DE": {
    originCity: "Lagos",
    destinationCity: "Berlin",
    rentIndex: 85,
    groceriesIndex: 75,
    transportIndex: 90,
    utilitiesIndex: 95,
    overallIndex: 86,
    difference: 180, // Berlin ~180% more expensive than Lagos
    stale: true,
  },
  "NG:US": {
    originCity: "Lagos",
    destinationCity: "New York",
    rentIndex: 95,
    groceriesIndex: 85,
    transportIndex: 85,
    utilitiesIndex: 80,
    overallIndex: 88,
    difference: 250,
    stale: true,
  },
  "NG:UK": {
    originCity: "Lagos",
    destinationCity: "London",
    rentIndex: 92,
    groceriesIndex: 80,
    transportIndex: 95,
    utilitiesIndex: 90,
    overallIndex: 89,
    difference: 220,
    stale: true,
  },
  "NG:CA": {
    originCity: "Lagos",
    destinationCity: "Toronto",
    rentIndex: 88,
    groceriesIndex: 78,
    transportIndex: 85,
    utilitiesIndex: 85,
    overallIndex: 84,
    difference: 200,
    stale: true,
  },
  "IN:US": {
    originCity: "Mumbai",
    destinationCity: "New York",
    rentIndex: 95,
    groceriesIndex: 85,
    transportIndex: 85,
    utilitiesIndex: 80,
    overallIndex: 88,
    difference: 200,
    stale: true,
  },
  "IN:UK": {
    originCity: "Mumbai",
    destinationCity: "London",
    rentIndex: 92,
    groceriesIndex: 80,
    transportIndex: 95,
    utilitiesIndex: 90,
    overallIndex: 89,
    difference: 180,
    stale: true,
  },
  "IN:DE": {
    originCity: "Mumbai",
    destinationCity: "Berlin",
    rentIndex: 75,
    groceriesIndex: 70,
    transportIndex: 85,
    utilitiesIndex: 88,
    overallIndex: 78,
    difference: 150,
    stale: true,
  },
  "PH:US": {
    originCity: "Manila",
    destinationCity: "New York",
    rentIndex: 95,
    groceriesIndex: 85,
    transportIndex: 85,
    utilitiesIndex: 80,
    overallIndex: 88,
    difference: 220,
    stale: true,
  },
  "PH:CA": {
    originCity: "Manila",
    destinationCity: "Vancouver",
    rentIndex: 90,
    groceriesIndex: 82,
    transportIndex: 88,
    utilitiesIndex: 85,
    overallIndex: 86,
    difference: 200,
    stale: true,
  },
  "BR:US": {
    originCity: "Sao Paulo",
    destinationCity: "New York",
    rentIndex: 95,
    groceriesIndex: 85,
    transportIndex: 85,
    utilitiesIndex: 80,
    overallIndex: 88,
    difference: 80,
    stale: true,
  },
  "BR:PT": {
    originCity: "Sao Paulo",
    destinationCity: "Lisbon",
    rentIndex: 70,
    groceriesIndex: 68,
    transportIndex: 75,
    utilitiesIndex: 80,
    overallIndex: 72,
    difference: 40,
    stale: true,
  },
};

function getDefaultComparison(origin: string, destination: string): CostComparison {
  return {
    originCity: origin,
    destinationCity: destination,
    rentIndex: 75,
    groceriesIndex: 70,
    transportIndex: 75,
    utilitiesIndex: 75,
    overallIndex: 74,
    difference: 100, // Assume 100% more expensive as default
    stale: true,
  };
}

export const fetchCostComparison = action({
  args: { origin: v.string(), destination: v.string() },
  handler: async (ctx, { origin, destination }): Promise<CostComparison> => {
    const normalizedOrigin = origin.toUpperCase();
    const normalizedDest = destination.toUpperCase();
    const cacheKey = `cost:${normalizedOrigin}:${normalizedDest}`;

    // Check cache
    const cached = await ctx.runQuery(api.cache.get, { key: cacheKey });
    if (cached && !cached.expired) {
      return cached.data as CostComparison;
    }

    try {
      // Try Numbeo API if key is available
      const apiKey = process.env.NUMBEO_API_KEY;

      if (apiKey) {
        // Numbeo uses country names, not codes - would need mapping
        // For now, skip direct API call and use fallback
        console.log("Numbeo API integration pending - using fallback data");
      }

      // Use fallback data
      const corridorKey = `${normalizedOrigin}:${normalizedDest}`;
      const fallbackData = FALLBACK_DATA[corridorKey] ?? getDefaultComparison(
        normalizedOrigin,
        normalizedDest
      );

      // Cache fallback data
      await ctx.runMutation(api.cache.set, {
        key: cacheKey,
        data: fallbackData,
        ttlMs: CACHE_TTL_MS,
      });

      return fallbackData;
    } catch (error) {
      console.error("Cost comparison error:", error);

      // Return stale cache if available
      if (cached) return { ...cached.data as CostComparison, stale: true };

      // Ultimate fallback
      return getDefaultComparison(origin, destination);
    }
  },
});
