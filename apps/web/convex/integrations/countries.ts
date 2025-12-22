"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export interface CountryData {
  name: string;
  officialName: string;
  capital: string;
  currencies: { code: string; name: string; symbol: string }[];
  languages: string[];
  timezone: string;
  flagUrl: string;
  region: string;
  population: number;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const fetchCountryData = action({
  args: { countryCode: v.string() },
  handler: async (ctx, { countryCode }): Promise<CountryData | null> => {
    const cacheKey = `countries:${countryCode.toUpperCase()}`;

    // Check cache first
    const cached = await ctx.runQuery(api.cache.get, { key: cacheKey });
    if (cached && !cached.expired) {
      return cached.data as CountryData;
    }

    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/alpha/${countryCode.toUpperCase()}`
      );

      if (!response.ok) {
        throw new Error(`REST Countries API error: ${response.status}`);
      }

      const [data] = await response.json();

      const countryData: CountryData = {
        name: data.name?.common ?? countryCode,
        officialName: data.name?.official ?? "",
        capital: data.capital?.[0] ?? "",
        currencies: Object.entries(data.currencies ?? {}).map(
          ([code, curr]: [string, unknown]) => {
            const currency = curr as { name: string; symbol: string };
            return {
              code,
              name: currency.name ?? "",
              symbol: currency.symbol ?? "",
            };
          }
        ),
        languages: Object.values(data.languages ?? {}) as string[],
        timezone: data.timezones?.[0] ?? "",
        flagUrl: data.flags?.svg ?? "",
        region: data.region ?? "",
        population: data.population ?? 0,
      };

      // Cache for 7 days
      await ctx.runMutation(api.cache.set, {
        key: cacheKey,
        data: countryData,
        ttlMs: CACHE_TTL_MS,
      });

      return countryData;
    } catch (error) {
      console.error("REST Countries error:", error);
      // Return stale cache if available
      if (cached) return cached.data as CountryData;
      return null;
    }
  },
});
