"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import {
  searchTemporaryHousing,
  compareCostOfLiving,
  findExpatCommunities,
  checkVisaResources,
  getHealthcareInfo,
  decodeCulturalSituation,
  getCulturalTips,
  type HousingSearchResult,
  type CostComparisonResult,
  type ExpatCommunityResult,
  type VisaResourcesResult,
  type HealthcareInfoResult,
  type CulturalDecoderResult,
  type CulturalTipsResult,
} from "@/lib/tools/migrationTools";
import { ExternalLink, Home, DollarSign, Users, FileText, Heart, Loader2, Globe2, Lightbulb, MessageCircle, ArrowRight } from "lucide-react";

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

  // Cultural Decoder Tool with Generative UI
  useCopilotAction({
    name: "decodeCulturalSituation",
    description: `Help users understand confusing cultural situations by explaining perspectives from both their origin culture and destination culture.
      Use when users describe awkward social interactions, misunderstandings, or ask "why do people here...?" questions.
      This tool provides bi-directional cultural intelligence.`,
    parameters: [
      {
        name: "situation",
        type: "string",
        description: "The cultural situation or interaction the user wants to understand",
        required: true,
      },
      {
        name: "originCountry",
        type: "string",
        description: "User's country of origin",
        required: true,
      },
      {
        name: "destinationCountry",
        type: "string",
        description: "Country where the situation occurred",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-amber-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Analyzing cultural context...</span>
          </div>
        );
      }

      const data = result as CulturalDecoderResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-black p-3 border-b-4 border-black flex items-center gap-2">
            <Globe2 size={20} />
            <span className="font-bold">Cultural Bridge</span>
          </div>

          {/* Two Perspectives */}
          <div className="grid md:grid-cols-2 gap-0 border-b-2 border-gray-200">
            {/* Origin Perspective */}
            <div className="p-4 bg-blue-50 border-r-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏠</span>
                <span className="font-bold text-blue-800">Your Cultural Lens</span>
              </div>
              <p className="text-sm text-blue-900">{data.originPerspective.interpretation}</p>
              <p className="text-xs text-blue-700 mt-2 italic">{data.originPerspective.culturalContext}</p>
            </div>

            {/* Destination Perspective */}
            <div className="p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌍</span>
                <span className="font-bold text-green-800">Local Perspective</span>
              </div>
              <p className="text-sm text-green-900">{data.destinationPerspective.interpretation}</p>
              <p className="text-xs text-green-700 mt-2 italic">{data.destinationPerspective.culturalContext}</p>
            </div>
          </div>

          {/* Bridging Advice */}
          <div className="p-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-yellow-600" />
              <span className="font-bold">Bridging the Gap</span>
            </div>
            <ul className="space-y-2">
              {data.bridgingAdvice.slice(0, 3).map((advice, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight size={14} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <span>{advice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recovery Phrases */}
          <div className="p-4 bg-purple-50">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={18} className="text-purple-600" />
              <span className="font-bold text-purple-800">Helpful Phrases</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.recoveryPhrases.slice(0, 3).map((phrase, i) => (
                <span key={i} className="px-3 py-1 bg-white border-2 border-purple-300 text-sm text-purple-800 rounded">
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    },
    handler: async ({ situation, originCountry, destinationCountry }) => {
      return decodeCulturalSituation(situation, originCountry, destinationCountry);
    },
  });

  // Cultural Tips Tool with Generative UI
  useCopilotAction({
    name: "getCulturalTips",
    description: `Get practical cultural tips for specific life situations in a destination country.
      Use when users ask about workplace culture, social norms, dining etiquette, daily life, or relationships.
      Provides actionable tips with context on "why" things are done differently.`,
    parameters: [
      {
        name: "destinationCountry",
        type: "string",
        description: "The country to get cultural tips for",
        required: true,
      },
      {
        name: "category",
        type: "string",
        description: "Category of tips: 'workplace', 'social', 'dining', 'daily_life', or 'relationships'",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-cyan-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding cultural insights for {args.category}...</span>
          </div>
        );
      }

      const data = result as CulturalTipsResult;
      if (!data) return <></>;

      const categoryEmojis: Record<string, string> = {
        workplace: "💼",
        social: "🤝",
        dining: "🍽️",
        daily_life: "🏙️",
        relationships: "❤️",
      };

      const categoryColors: Record<string, string> = {
        workplace: "bg-blue-500",
        social: "bg-purple-500",
        dining: "bg-orange-500",
        daily_life: "bg-green-500",
        relationships: "bg-pink-500",
      };

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className={`${categoryColors[args.category] || "bg-cyan-500"} text-white p-3 border-b-4 border-black flex items-center gap-2`}>
            <span className="text-xl">{categoryEmojis[args.category] || "🌍"}</span>
            <span className="font-bold capitalize">{data.category.replace("_", " ")} Tips for {args.destinationCountry}</span>
          </div>

          <div className="p-4 space-y-4">
            {data.tips.map((tip, i) => (
              <div key={i} className="p-3 bg-gray-50 border-2 border-gray-200">
                <p className="font-bold text-gray-800">{tip.tip}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Why:</span> {tip.why}
                </p>
                {tip.doInstead && (
                  <p className="text-sm text-green-700 mt-1">
                    <span className="font-medium">Instead:</span> {tip.doInstead}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-gray-100 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-2">Learn more:</p>
            <div className="flex flex-wrap gap-2">
              {data.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border-2 border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                >
                  {resource.name}
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </div>
        </div>
      );
    },
    handler: async ({ destinationCountry, category }) => {
      return getCulturalTips(
        destinationCountry,
        category as "workplace" | "social" | "dining" | "daily_life" | "relationships"
      );
    },
  });
}
