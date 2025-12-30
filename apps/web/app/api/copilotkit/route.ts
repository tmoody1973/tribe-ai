import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";
import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client for Fireplexity actions
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Load housing resources data
const housingDataPath = path.join(process.cwd(), "../../docs/migrant_housing_resources.json");
const housingData = JSON.parse(fs.readFileSync(housingDataPath, "utf-8"));

// CopilotKit runtime with housing resources action
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "searchHousingResources",
      description:
        "Search for housing resources and assistance programs for migrants and refugees by country. Use this when users ask about finding housing, shelter, accommodation, or housing assistance in a specific country.",
      parameters: [
        {
          name: "country",
          type: "string",
          description:
            "The destination country to search for housing resources (e.g., 'United States', 'Canada', 'Germany'). Can be full name or common abbreviation.",
          required: false,
        },
        {
          name: "continent",
          type: "string",
          description:
            "Filter by continent (e.g., 'North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania')",
          required: false,
        },
        {
          name: "resourceType",
          type: "string",
          description:
            "Type of resource (e.g., 'Government Agency', 'NGO', 'International Organization', 'Online Platform', 'University Housing')",
          required: false,
        },
      ],
      handler: async ({ country, continent, resourceType }: any) => {
        let results = housingData.housing_resources;

        // Filter by country
        if (country && typeof country === "string") {
          const countryLower = country.toLowerCase();
          results = results.filter(
            (r: any) =>
              r.country.toLowerCase().includes(countryLower) ||
              r.country_code?.toLowerCase() === countryLower
          );
        }

        // Filter by continent
        if (continent && typeof continent === "string") {
          const continentLower = continent.toLowerCase();
          results = results.filter((r: any) => r.continent.toLowerCase().includes(continentLower));
        }

        // Extract resources and filter by type if specified
        let allResources: any[] = [];
        results.forEach((countryData: any) => {
          countryData.resources.forEach((resource: any) => {
            allResources.push({
              country: countryData.country,
              continent: countryData.continent,
              ...resource,
            });
          });
        });

        if (resourceType && typeof resourceType === "string") {
          const typeLower = resourceType.toLowerCase();
          allResources = allResources.filter((r) =>
            r.resource_type.toLowerCase().includes(typeLower)
          );
        }

        // Limit to 10 most relevant results
        const limitedResults = allResources.slice(0, 10);

        // If no results found, suggest live search
        if (allResources.length === 0 && country) {
          return {
            total_found: 0,
            results: [],
            metadata: housingData.metadata,
            suggestion: {
              message: `💡 No housing resources found in our database for ${country}. Would you like me to search for the latest programs?`,
              action: "searchLiveData",
              actionLabel: "🔍 Search Live Data",
              note: "Uses 1 of 50 monthly live searches",
            },
          };
        }

        return {
          total_found: allResources.length,
          results: limitedResults.map((r) => ({
            country: r.country,
            continent: r.continent,
            organization: r.organization_name,
            url: r.url,
            description: r.description,
            type: r.resource_type,
            services: r.services,
          })),
          metadata: housingData.metadata,
        };
      },
    },
    {
      name: "searchLiveData",
      description:
        "Search live web data for up-to-date migration resources, visa updates, housing programs, job opportunities, and policy changes. ONLY use when: (1) User explicitly requests 'current', 'latest', or 'live' data, (2) Static data search returned no results, or (3) Information needs to be verified as current. This action uses limited monthly quota (50 searches/month).",
      parameters: [
        {
          name: "query",
          type: "string",
          description: "The search query for live data (e.g., 'housing programs in Berlin 2025')",
          required: true,
        },
        {
          name: "targetCountry",
          type: "string",
          description: "The destination country to focus the search (optional)",
          required: false,
        },
      ],
      handler: async ({ query, targetCountry }: any) => {
        try {
          // Check quota first
          const quotaStatus = await convex.query(api.fireplexity.checkFireplexityQuota);

          if (!quotaStatus.available) {
            return {
              error: true,
              message: `⚠️ Live search quota exceeded this month (${quotaStatus.used}/${quotaStatus.limit} used). Quota resets in ${quotaStatus.daysUntilReset} days. Showing cached data instead.`,
              quotaStatus,
            };
          }

          // Execute Fireplexity search
          const results = await convex.action(api.fireplexity.fireplexitySearch, {
            query,
            targetCountry,
          });

          if (results.error) {
            return results;
          }

          return {
            success: true,
            answer: results.answer,
            sources: results.sources,
            scrapedData: results.scrapedData?.map((s: any) => ({
              url: s.url,
              title: s.title,
              preview: s.markdown?.slice(0, 500) + "...",
            })),
            dataFreshness: results.dataFreshness,
            quotaRemaining: results.quotaStatus.remaining,
            quotaUsed: results.quotaStatus.used,
            quotaLimit: results.quotaStatus.limit,
          };
        } catch (error) {
          return {
            error: true,
            message: `❌ Live search failed: ${String(error)}. Please try again or use cached data.`,
          };
        }
      },
    },
    {
      name: "searchVisaOptions",
      description:
        "Discover visa requirements and pathways for migration between countries. Use this when users ask about visas, visa requirements, visa types, or what visa they need. Provides detailed visa information including requirements, processing times, and difficulty scores.",
      parameters: [
        {
          name: "origin",
          type: "string",
          description:
            "Origin country (passport country) - use ISO 3166-1 alpha-3 code (e.g., 'NGA' for Nigeria, 'IND' for India, 'PHL' for Philippines)",
          required: true,
        },
        {
          name: "destination",
          type: "string",
          description:
            "Destination country - use ISO 3166-1 alpha-3 code (e.g., 'CAN' for Canada, 'USA' for United States, 'GBR' for UK)",
          required: true,
        },
        {
          name: "getProcessingTimes",
          type: "boolean",
          description: "Whether to fetch real-time processing times (uses Perplexity API)",
          required: false,
        },
      ],
      handler: async ({ origin, destination, getProcessingTimes = false }: any) => {
        try {
          // Get visa requirements
          const visaReqs = await convex.action(api.visaDiscovery.getVisaRequirementsForCorridor, {
            origin,
            destination,
          });

          if (visaReqs.error) {
            return visaReqs;
          }

          const result: any = {
            success: true,
            origin,
            destination,
            visaRequired: visaReqs.visaRequired,
            visaType: visaReqs.visaType,
            stayDuration: visaReqs.stayDuration,
            requirements: visaReqs.requirements || [],
            estimatedCost: visaReqs.cost,
            cached: visaReqs.cached,
            quotaRemaining: visaReqs.quotaRemaining,
          };

          // Get processing times if requested
          if (getProcessingTimes && visaReqs.visaType) {
            const processingTimes = await convex.action(api.visaDiscovery.getProcessingTimes, {
              origin,
              destination,
              visaType: visaReqs.visaType,
            });

            if (processingTimes.success) {
              result.processingTime = {
                averageDays: processingTimes.averageProcessingDays,
                source: processingTimes.source,
                cached: processingTimes.cached,
              };
            }
          }

          return result;
        } catch (error) {
          return {
            error: true,
            message: `❌ Failed to fetch visa information: ${String(error)}`,
          };
        }
      },
    },
  ],
});

// Use Google Gemini 2.5 Flash as the LLM provider
const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-2.5-flash",
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
