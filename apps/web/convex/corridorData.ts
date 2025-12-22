"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { CountryData } from "./integrations/countries";
import type { VisaRequirements } from "./integrations/visa";
import type { CostComparison } from "./integrations/costOfLiving";

export interface CorridorBaseline {
  origin: CountryData | null;
  destination: CountryData | null;
  visa: VisaRequirements | null;
  costComparison: CostComparison | null;
  fetchedAt: number;
  errors: string[];
}

export const getCorridorBaseline = action({
  args: { origin: v.string(), destination: v.string() },
  handler: async (ctx, { origin, destination }): Promise<CorridorBaseline> => {
    const errors: string[] = [];

    // Fetch all data in parallel
    const [originCountry, destCountry, visaReqs, costData] = await Promise.allSettled([
      ctx.runAction(api.integrations.countries.fetchCountryData, {
        countryCode: origin,
      }),
      ctx.runAction(api.integrations.countries.fetchCountryData, {
        countryCode: destination,
      }),
      ctx.runAction(api.integrations.visa.fetchVisaRequirements, {
        origin,
        destination,
      }),
      ctx.runAction(api.integrations.costOfLiving.fetchCostComparison, {
        origin,
        destination,
      }),
    ]);

    // Extract results with error tracking
    const originData = originCountry.status === "fulfilled" ? originCountry.value : null;
    if (originCountry.status === "rejected") {
      errors.push(`Failed to fetch origin country data: ${originCountry.reason}`);
    }

    const destData = destCountry.status === "fulfilled" ? destCountry.value : null;
    if (destCountry.status === "rejected") {
      errors.push(`Failed to fetch destination country data: ${destCountry.reason}`);
    }

    const visaData = visaReqs.status === "fulfilled" ? visaReqs.value : null;
    if (visaReqs.status === "rejected") {
      errors.push(`Failed to fetch visa requirements: ${visaReqs.reason}`);
    }

    const costCompData = costData.status === "fulfilled" ? costData.value : null;
    if (costData.status === "rejected") {
      errors.push(`Failed to fetch cost comparison: ${costData.reason}`);
    }

    return {
      origin: originData,
      destination: destData,
      visa: visaData,
      costComparison: costCompData,
      fetchedAt: Date.now(),
      errors,
    };
  },
});

export interface CorridorSummary {
  originName: string;
  destinationName: string;
  visaRequired: boolean;
  visaType: string | null;
  eVisaAvailable: boolean;
}

// Lightweight version that just gets essential data
export const getCorridorSummary = action({
  args: { origin: v.string(), destination: v.string() },
  handler: async (ctx, { origin, destination }): Promise<CorridorSummary> => {
    // Fetch visa requirements (most critical)
    const visaReqs = await ctx.runAction(api.integrations.visa.fetchVisaRequirements, {
      origin,
      destination,
    });

    // Fetch just the basic country names
    const [originCountry, destCountry] = await Promise.all([
      ctx.runAction(api.integrations.countries.fetchCountryData, {
        countryCode: origin,
      }),
      ctx.runAction(api.integrations.countries.fetchCountryData, {
        countryCode: destination,
      }),
    ]);

    return {
      originName: originCountry?.name ?? origin,
      destinationName: destCountry?.name ?? destination,
      visaRequired: visaReqs?.visaRequired ?? true,
      visaType: visaReqs?.visaType ?? null,
      eVisaAvailable: visaReqs?.eVisaAvailable ?? false,
    };
  },
});
