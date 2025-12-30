"use client";

/**
 * Hook to register renderers for ADK agent tool calls.
 *
 * These tools run on the ADK backend, but we provide custom UI rendering
 * on the frontend using useCopilotAction with available: "remote".
 */

import { useCopilotAction } from "@copilotkit/react-core";
import { HousingResourcesCard, LiveSearchPrompt } from "@/components/chat/HousingResourcesCard";
import {
  LiveSearchCard,
  LiveSearchLoading,
  QuotaExceededCard,
  LiveSearchErrorCard,
} from "@/components/chat/LiveSearchCard";
import {
  VisaPathwayCard,
  VisaSearchLoading,
  VisaErrorCard,
} from "@/components/chat/VisaPathwayCard";

interface HousingSearchResult {
  total_found: number;
  results: Array<{
    country: string;
    continent: string;
    organization: string;
    url: string;
    description: string;
    type: string;
    services: string[];
  }>;
  metadata: Record<string, unknown>;
  suggestion?: {
    message: string;
    action: string;
    actionLabel: string;
    note: string;
  };
}

interface LiveSearchResult {
  success?: boolean;
  error?: boolean;
  quotaExceeded?: boolean;
  message?: string;
  answer?: string;
  sources?: string[];
  scrapedData?: Array<{
    url: string;
    title: string;
    preview: string;
  }>;
  quotaRemaining?: number;
  quotaUsed?: number;
  quotaLimit?: number;
  quotaStatus?: {
    daysUntilReset: number;
    used: number;
    limit: number;
  };
  dataFreshness?: string;
}

interface VisaSearchResult {
  success?: boolean;
  error?: boolean;
  message?: string;
  origin?: string;
  destination?: string;
  visaRequired?: boolean;
  visaType?: string;
  stayDuration?: string;
  requirements?: string[];
  estimatedCost?: string;
  processingTime?: {
    averageDays: number;
    source: string;
    cached?: boolean;
  };
  cached?: boolean;
  quotaRemaining?: number;
  suggestions?: string[];
}

export function useADKToolRenderers() {
  // Housing Resources Search - renders results from ADK agent tool
  useCopilotAction({
    name: "search_housing_resources",
    description: "Search for housing resources and assistance programs for migrants and refugees.",
    parameters: [
      {
        name: "country",
        type: "string",
        description: "Destination country to search",
        required: false,
      },
      {
        name: "continent",
        type: "string",
        description: "Filter by continent",
        required: false,
      },
      {
        name: "resource_type",
        type: "string",
        description: "Type of resource",
        required: false,
      },
    ],
    available: "remote", // Tool is handled by ADK agent, we just render
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <HousingResourcesCard
            results={[]}
            totalFound={0}
            isLoading={true}
            searchCountry={args?.country as string}
          />
        );
      }

      if (status === "complete" && result) {
        const data = result as HousingSearchResult;

        // If suggestion returned (no results), show live search prompt
        if (data.suggestion) {
          return <LiveSearchPrompt suggestion={data.suggestion} />;
        }

        return (
          <HousingResourcesCard
            results={data.results}
            totalFound={data.total_found}
          />
        );
      }

      // Return empty fragment for other states (executing, etc.)
      return <></>;
    },
  });

  // Live Data Search - renders Fireplexity search results from ADK agent tool
  useCopilotAction({
    name: "search_live_data",
    description: "Search live web data for up-to-date migration resources using Fireplexity.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query describing what to look for",
        required: true,
      },
      {
        name: "target_country",
        type: "string",
        description: "Country to focus the search on",
        required: false,
      },
    ],
    available: "remote", // Tool is handled by ADK agent, we just render
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return <LiveSearchLoading query={args?.query as string} />;
      }

      if (status === "complete" && result) {
        const data = result as LiveSearchResult;

        // Handle quota exceeded
        if (data.quotaExceeded && data.quotaStatus) {
          return (
            <QuotaExceededCard
              daysUntilReset={data.quotaStatus.daysUntilReset}
              used={data.quotaStatus.used}
              limit={data.quotaStatus.limit}
            />
          );
        }

        // Handle errors
        if (data.error && data.message) {
          return <LiveSearchErrorCard message={data.message} />;
        }

        // Handle successful results
        if (data.success && data.answer) {
          return (
            <LiveSearchCard
              result={{
                success: true,
                answer: data.answer,
                sources: data.sources || [],
                scrapedData: data.scrapedData,
                quotaRemaining: data.quotaRemaining || 0,
                quotaLimit: data.quotaLimit || 50,
                dataFreshness: data.dataFreshness,
              }}
            />
          );
        }
      }

      // Return empty fragment for other states
      return <></>;
    },
  });

  // Visa Options Search - renders visa pathway information from ADK agent tool
  useCopilotAction({
    name: "search_visa_options",
    description: "Discover visa requirements and pathways for migration between countries.",
    parameters: [
      {
        name: "origin",
        type: "string",
        description: "Origin country (passport country) - name or ISO3 code",
        required: true,
      },
      {
        name: "destination",
        type: "string",
        description: "Destination country - name or ISO3 code",
        required: true,
      },
      {
        name: "get_processing_times",
        type: "boolean",
        description: "Whether to fetch processing time estimates",
        required: false,
      },
    ],
    available: "remote", // Tool is handled by ADK agent, we just render
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <VisaSearchLoading
            origin={args?.origin as string}
            destination={args?.destination as string}
          />
        );
      }

      if (status === "complete" && result) {
        const data = result as VisaSearchResult;

        // Handle errors
        if (data.error && data.message) {
          return (
            <VisaErrorCard
              message={data.message}
              suggestions={data.suggestions}
            />
          );
        }

        // Handle successful results
        if (data.success && data.origin && data.destination) {
          return (
            <VisaPathwayCard
              result={{
                success: true,
                origin: data.origin,
                destination: data.destination,
                visaRequired: data.visaRequired ?? true,
                visaType: data.visaType || "Unknown",
                stayDuration: data.stayDuration || "Varies",
                requirements: data.requirements || [],
                estimatedCost: data.estimatedCost,
                processingTime: data.processingTime,
                cached: data.cached,
                quotaRemaining: data.quotaRemaining,
              }}
            />
          );
        }
      }

      // Return empty fragment for other states
      return <></>;
    },
  });
}
