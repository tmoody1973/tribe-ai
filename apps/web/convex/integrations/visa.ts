"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

export interface VisaRequirements {
  visaRequired: boolean;
  visaType: string | null;
  stayDuration: number | null;
  requirements: string[];
  processingTime: string | null;
  eVisaAvailable: boolean;
  eVisaLink: string | null;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Fallback using Passport Index data
function getFallbackVisaData(passportData: { requirement: string } | null): VisaRequirements {
  const requirement = passportData?.requirement?.toLowerCase() ?? "unknown";

  // Parse passport index requirement codes
  const visaFree = requirement.includes("visa-free") ||
                   requirement.includes("visa free") ||
                   requirement === "vf" ||
                   requirement.includes("-1"); // -1 often means visa-free

  const eVisa = requirement.includes("eta") ||
                requirement.includes("evisa") ||
                requirement.includes("e-visa");

  return {
    visaRequired: !visaFree,
    visaType: visaFree ? null : (eVisa ? "e-Visa" : "Standard Visa"),
    stayDuration: visaFree ? 90 : null, // Common visa-free stay duration
    requirements: [],
    processingTime: null,
    eVisaAvailable: eVisa,
    eVisaLink: null,
  };
}

export const fetchVisaRequirements = action({
  args: { origin: v.string(), destination: v.string() },
  handler: async (ctx, { origin, destination }): Promise<VisaRequirements> => {
    const normalizedOrigin = origin.toUpperCase();
    const normalizedDest = destination.toUpperCase();
    const cacheKey = `visa:${normalizedOrigin}:${normalizedDest}`;

    // Check cache
    const cached = await ctx.runQuery(api.cache.get, { key: cacheKey });
    if (cached && !cached.expired) {
      return cached.data as VisaRequirements;
    }

    try {
      // Try Travel Buddy API if key is available
      const apiKey = process.env.TRAVEL_BUDDY_API_KEY;

      if (apiKey) {
        const response = await fetch(
          `https://travel-buddy.ai/api/visa?from=${normalizedOrigin}&to=${normalizedDest}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        );

        if (response.ok) {
          const data = await response.json();

          const visaData: VisaRequirements = {
            visaRequired: data.visa_required ?? true,
            visaType: data.visa_type ?? null,
            stayDuration: data.allowed_stay ?? null,
            requirements: data.requirements ?? [],
            processingTime: data.processing_time ?? null,
            eVisaAvailable: data.evisa_available ?? false,
            eVisaLink: data.evisa_link ?? null,
          };

          // Cache for 7 days
          await ctx.runMutation(api.cache.set, {
            key: cacheKey,
            data: visaData,
            ttlMs: CACHE_TTL_MS,
          });

          return visaData;
        }
      }

      // Fallback to passport index data
      const passportData = await ctx.runQuery(internal.passportIndex.getRequirementInternal, {
        origin: normalizedOrigin,
        destination: normalizedDest,
      });

      const fallbackData = getFallbackVisaData(passportData);

      // Cache fallback data too
      await ctx.runMutation(api.cache.set, {
        key: cacheKey,
        data: fallbackData,
        ttlMs: CACHE_TTL_MS,
      });

      return fallbackData;
    } catch (error) {
      console.error("Visa requirements error:", error);

      // Return stale cache if available
      if (cached) return cached.data as VisaRequirements;

      // Ultimate fallback
      return getFallbackVisaData(null);
    }
  },
});
