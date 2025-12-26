"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import {
  searchTemporaryHousing,
  compareCostOfLiving,
  findExpatCommunities,
  checkVisaResources,
  getHealthcareInfo,
  type HousingSearchResult,
  type CostComparisonResult,
  type ExpatCommunityResult,
  type VisaResourcesResult,
  type HealthcareInfoResult,
} from "@/lib/tools/migrationTools";
import { ExternalLink, Home, DollarSign, Users, FileText, Heart, Loader2 } from "lucide-react";

export function useMigrationTools() {
  // Housing Search Tool with Generative UI
  useCopilotAction({
    name: "searchTemporaryHousing",
    description: `Search for temporary housing (Airbnb, Booking.com, Vrbo, etc.) for users relocating to a new country.
      Returns deep links to multiple housing platforms optimized for monthly stays.
      ALWAYS use this tool when the user asks about housing, apartments, accommodation, or places to stay.`,
    parameters: [
      {
        name: "city",
        type: "string",
        description: "Destination city name",
        required: true,
      },
      {
        name: "country",
        type: "string",
        description: "Destination country name",
        required: true,
      },
      {
        name: "guests",
        type: "number",
        description: "Number of guests (default 1)",
        required: false,
      },
      {
        name: "stayType",
        type: "string",
        description: "Type of stay: 'short' (< 1 week), 'monthly' (1-3 months), or 'long_term' (3+ months)",
        required: false,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-blue-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Searching housing in {args.city}...</span>
          </div>
        );
      }

      const data = result as HousingSearchResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-blue-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <Home size={20} />
            <span className="font-bold">Housing in {data.location.city}, {data.location.country}</span>
          </div>
          <div className="p-4 space-y-3">
            {data.platforms.map((platform, i) => (
              <a
                key={i}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <span className="font-bold text-lg">{platform.name}</span>
                  <p className="text-sm text-gray-600">{platform.bestFor}</p>
                </div>
                <ExternalLink size={20} className="text-gray-400 group-hover:text-blue-500" />
              </a>
            ))}
          </div>
          <div className="p-3 bg-yellow-50 border-t-2 border-black">
            <p className="font-bold text-sm mb-2">Tips:</p>
            <ul className="text-sm space-y-1">
              {data.tips.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    },
    handler: async ({ city, country, guests, stayType }) => {
      return searchTemporaryHousing({
        city,
        country,
        guests: guests || 1,
        stayType: (stayType as "short" | "monthly" | "long_term") || "monthly",
      });
    },
  });

  // Cost of Living Comparison Tool with Generative UI
  useCopilotAction({
    name: "compareCostOfLiving",
    description: `Compare cost of living between two cities. Use when users ask about expenses, budgeting,
      or how expensive a destination is compared to their current location.`,
    parameters: [
      {
        name: "originCity",
        type: "string",
        description: "Current city",
        required: true,
      },
      {
        name: "originCountry",
        type: "string",
        description: "Current country",
        required: true,
      },
      {
        name: "destinationCity",
        type: "string",
        description: "Destination city",
        required: true,
      },
      {
        name: "destinationCountry",
        type: "string",
        description: "Destination country",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-green-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Comparing costs...</span>
          </div>
        );
      }

      const data = result as CostComparisonResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-green-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <DollarSign size={20} />
            <span className="font-bold">{args.originCity} vs {args.destinationCity}</span>
          </div>
          <div className="p-4 space-y-3">
            <a
              href={data.comparison.numbeoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors group"
            >
              <div>
                <span className="font-bold text-lg">Numbeo</span>
                <p className="text-sm text-gray-600">Detailed cost breakdown with user data</p>
              </div>
              <ExternalLink size={20} className="text-gray-400 group-hover:text-green-500" />
            </a>
            <a
              href={data.comparison.expatistanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors group"
            >
              <div>
                <span className="font-bold text-lg">Expatistan</span>
                <p className="text-sm text-gray-600">Visual comparison charts</p>
              </div>
              <ExternalLink size={20} className="text-gray-400 group-hover:text-green-500" />
            </a>
          </div>
          <div className="p-3 bg-gray-50 border-t-2 border-black text-sm text-gray-600">
            {data.note}
          </div>
        </div>
      );
    },
    handler: async ({ originCity, originCountry, destinationCity, destinationCountry }) => {
      return compareCostOfLiving(originCity, originCountry, destinationCity, destinationCountry);
    },
  });

  // Expat Community Finder Tool with Generative UI
  useCopilotAction({
    name: "findExpatCommunities",
    description: `Find expat communities, forums, and social groups in a destination city.
      Use when users ask about connecting with other expats, making friends, or finding community.`,
    parameters: [
      {
        name: "city",
        type: "string",
        description: "Destination city",
        required: true,
      },
      {
        name: "country",
        type: "string",
        description: "Destination country",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-purple-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding communities in {args.city}...</span>
          </div>
        );
      }

      const data = result as ExpatCommunityResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-purple-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <Users size={20} />
            <span className="font-bold">Expat Communities in {args.city}</span>
          </div>
          <div className="p-4 space-y-3">
            {data.communities.map((community, i) => (
              <a
                key={i}
                href={community.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <span className="font-bold text-lg">{community.platform}</span>
                  <p className="text-sm text-gray-600">{community.type}</p>
                </div>
                <ExternalLink size={20} className="text-gray-400 group-hover:text-purple-500" />
              </a>
            ))}
          </div>
        </div>
      );
    },
    handler: async ({ city, country }) => {
      return findExpatCommunities(city, country);
    },
  });

  // Visa Resources Tool with Generative UI
  useCopilotAction({
    name: "checkVisaResources",
    description: `Get visa requirement resources for relocating to a new country.
      Use when users ask about visas, work permits, or legal requirements for staying in a country.`,
    parameters: [
      {
        name: "passportCountry",
        type: "string",
        description: "Country of passport/citizenship",
        required: true,
      },
      {
        name: "destinationCountry",
        type: "string",
        description: "Country relocating to",
        required: true,
      },
      {
        name: "purposeOfStay",
        type: "string",
        description: "Purpose: 'tourism', 'work', 'study', 'digital_nomad', or 'retirement'",
        required: false,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-orange-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding visa info for {args.destinationCountry}...</span>
          </div>
        );
      }

      const data = result as VisaResourcesResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-orange-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <FileText size={20} />
            <span className="font-bold">Visa Resources: {args.destinationCountry}</span>
          </div>
          <div className="p-4 space-y-3">
            {data.resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <span className="font-bold text-lg">{resource.name}</span>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </div>
                <ExternalLink size={20} className="text-gray-400 group-hover:text-orange-500" />
              </a>
            ))}
          </div>
          <div className="p-3 bg-red-50 border-t-2 border-black text-sm text-red-700">
            <strong>Important:</strong> {data.disclaimer}
          </div>
        </div>
      );
    },
    handler: async ({ passportCountry, destinationCountry, purposeOfStay }) => {
      return checkVisaResources(
        passportCountry,
        destinationCountry,
        (purposeOfStay as "tourism" | "work" | "study" | "digital_nomad" | "retirement") || "work"
      );
    },
  });

  // Healthcare Info Tool with Generative UI
  useCopilotAction({
    name: "getHealthcareInfo",
    description: `Get healthcare and insurance information for relocating to a new country.
      Use when users ask about health insurance, medical care, or healthcare systems abroad.`,
    parameters: [
      {
        name: "destinationCountry",
        type: "string",
        description: "Country relocating to",
        required: true,
      },
      {
        name: "stayDuration",
        type: "string",
        description: "Expected duration: 'short_term', 'long_term', or 'permanent'",
        required: false,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding healthcare info for {args.destinationCountry}...</span>
          </div>
        );
      }

      const data = result as HealthcareInfoResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-red-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <Heart size={20} />
            <span className="font-bold">Healthcare in {args.destinationCountry}</span>
          </div>
          <div className="p-4 space-y-3">
            {data.resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <span className="font-bold text-lg">{resource.name}</span>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </div>
                <ExternalLink size={20} className="text-gray-400 group-hover:text-red-500" />
              </a>
            ))}
          </div>
          <div className="p-3 bg-blue-50 border-t-2 border-black">
            <p className="font-bold text-sm mb-2">Key Considerations:</p>
            <ul className="text-sm space-y-1">
              {data.considerations.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    },
    handler: async ({ destinationCountry, stayDuration }) => {
      return getHealthcareInfo(
        destinationCountry,
        (stayDuration as "short_term" | "long_term" | "permanent") || "long_term"
      );
    },
  });
}
