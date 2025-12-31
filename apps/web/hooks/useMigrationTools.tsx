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
  getDocumentChecklist,
  getBankingGuide,
  getLanguageResources,
  getJobSearchResources,
  type HousingSearchResult,
  type CostComparisonResult,
  type ExpatCommunityResult,
  type VisaResourcesResult,
  type HealthcareInfoResult,
  type CulturalDecoderResult,
  type CulturalTipsResult,
  type DocumentChecklistResult,
  type BankingGuideResult,
  type LanguageResourcesResult,
  type JobSearchResult,
} from "@/lib/tools/migrationTools";
import { ExternalLink, Home, DollarSign, Users, FileText, Heart, Loader2, Globe2, Lightbulb, MessageCircle, ArrowRight, CheckCircle2, Building2, BookOpen, Briefcase, AlertCircle, Search, Sparkles } from "lucide-react";

// Live search result type
interface LiveSearchResult {
  success?: boolean;
  error?: boolean;
  message?: string;
  answer?: string;
  sources?: string[];
  quotaRemaining?: number;
  quotaUsed?: number;
  quotaLimit?: number;
}

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

  // Document Checklist Tool with Generative UI
  useCopilotAction({
    name: "getDocumentChecklist",
    description: `Get a comprehensive document checklist for migrating to a new country.
      Use when users ask about documents needed for moving, visa paperwork, or what to prepare before relocating.`,
    parameters: [
      {
        name: "destinationCountry",
        type: "string",
        description: "Country relocating to",
        required: true,
      },
      {
        name: "purpose",
        type: "string",
        description: "Purpose of migration: 'work', 'study', 'family', or 'retirement'",
        required: false,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-indigo-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Preparing document checklist for {args.destinationCountry}...</span>
          </div>
        );
      }

      const data = result as DocumentChecklistResult;
      if (!data) return <></>;

      const urgencyColors = {
        essential: "bg-red-100 text-red-700 border-red-300",
        important: "bg-yellow-100 text-yellow-700 border-yellow-300",
        recommended: "bg-green-100 text-green-700 border-green-300",
      };

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-indigo-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <CheckCircle2 size={20} />
            <span className="font-bold">Document Checklist: {args.destinationCountry}</span>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {data.checklist.map((category, i) => (
              <div key={i} className="border-2 border-gray-200">
                <div className="bg-gray-100 px-3 py-2 font-bold text-sm">{category.category}</div>
                <div className="p-2 space-y-2">
                  {category.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 p-2 bg-white">
                      <span className={`text-xs px-2 py-0.5 border rounded ${urgencyColors[item.urgency]}`}>
                        {item.urgency}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.document}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-50 border-t-2 border-gray-200 flex flex-wrap gap-2">
            {data.resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-white border-2 border-gray-300 text-sm hover:bg-gray-50"
              >
                {resource.name}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      );
    },
    handler: async ({ destinationCountry, purpose }) => {
      return getDocumentChecklist(
        destinationCountry,
        (purpose as "work" | "study" | "family" | "retirement") || "work"
      );
    },
  });

  // Banking Guide Tool with Generative UI
  useCopilotAction({
    name: "getBankingGuide",
    description: `Get a guide for setting up banking in a new country.
      Use when users ask about opening a bank account abroad, money transfers, or financial setup when relocating.`,
    parameters: [
      {
        name: "destinationCountry",
        type: "string",
        description: "Country relocating to",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding banking options in {args.destinationCountry}...</span>
          </div>
        );
      }

      const data = result as BankingGuideResult;
      if (!data) return <></>;

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-emerald-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <Building2 size={20} />
            <span className="font-bold">Banking in {args.destinationCountry}</span>
          </div>

          {/* Steps */}
          <div className="p-4 border-b-2 border-gray-200">
            <p className="font-bold text-sm mb-2">Setup Steps:</p>
            <ol className="space-y-2">
              {data.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium">{step.step}</span>
                    <span className="text-gray-500"> - {step.details}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Banks */}
          <div className="p-4 space-y-2">
            <p className="font-bold text-sm mb-2">Recommended Banks:</p>
            {data.banks.slice(0, 5).map((bank, i) => (
              <a
                key={i}
                href={bank.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{bank.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{bank.type}</span>
                  </div>
                  <p className="text-xs text-gray-500">{bank.bestFor}</p>
                </div>
                <ExternalLink size={16} className="text-gray-400 group-hover:text-emerald-500" />
              </a>
            ))}
          </div>

          {/* Tips */}
          <div className="p-3 bg-yellow-50 border-t-2 border-yellow-200">
            <p className="font-bold text-sm mb-2">Tips:</p>
            <ul className="text-sm space-y-1">
              {data.tips.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Lightbulb size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    },
    handler: async ({ destinationCountry }) => {
      return getBankingGuide(destinationCountry);
    },
  });

  // Language Resources Tool with Generative UI
  useCopilotAction({
    name: "getLanguageResources",
    description: `Get language learning resources for the destination country.
      Use when users ask about learning the local language, language courses, or how to communicate in their new country.`,
    parameters: [
      {
        name: "destinationCountry",
        type: "string",
        description: "Country relocating to",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-violet-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding language resources for {args.destinationCountry}...</span>
          </div>
        );
      }

      const data = result as LanguageResourcesResult;
      if (!data) return <></>;

      const typeIcons: Record<string, string> = {
        app: "📱",
        course: "📚",
        community: "👥",
        media: "🎬",
      };

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-violet-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <BookOpen size={20} />
            <span className="font-bold">Learn {data.language}</span>
          </div>

          <div className="p-4 space-y-2">
            {data.resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{typeIcons[resource.type]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{resource.name}</span>
                      {resource.free && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Free</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{resource.bestFor}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400 group-hover:text-violet-500" />
              </a>
            ))}
          </div>

          <div className="p-3 bg-violet-50 border-t-2 border-violet-200">
            <p className="font-bold text-sm mb-2">Learning Tips:</p>
            <ul className="text-sm space-y-1">
              {data.tips.slice(0, 4).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-violet-600">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    },
    handler: async ({ destinationCountry }) => {
      return getLanguageResources(destinationCountry);
    },
  });

  // Job Search Tool with Generative UI
  useCopilotAction({
    name: "getJobSearchResources",
    description: `Get job search platforms and resources for finding work in a destination country.
      Use when users ask about finding jobs abroad, employment opportunities, or how to get hired in their new country.`,
    parameters: [
      {
        name: "destinationCountry",
        type: "string",
        description: "Country looking for jobs in",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-sky-50 border-2 border-black">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold">Finding job platforms in {args.destinationCountry}...</span>
          </div>
        );
      }

      const data = result as JobSearchResult;
      if (!data) return <></>;

      const typeColors: Record<string, string> = {
        general: "bg-gray-100 text-gray-700",
        expat: "bg-blue-100 text-blue-700",
        tech: "bg-purple-100 text-purple-700",
        remote: "bg-green-100 text-green-700",
      };

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-sky-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
            <Briefcase size={20} />
            <span className="font-bold">Jobs in {args.destinationCountry}</span>
          </div>

          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
            {data.platforms.map((platform, i) => (
              <a
                key={i}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{platform.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${typeColors[platform.type]}`}>
                      {platform.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{platform.description}</p>
                </div>
                <ExternalLink size={16} className="text-gray-400 group-hover:text-sky-500" />
              </a>
            ))}
          </div>

          <div className="p-3 bg-sky-50 border-t-2 border-sky-200">
            <p className="font-bold text-sm mb-2">Job Search Tips:</p>
            <ul className="text-sm space-y-1">
              {data.tips.slice(0, 4).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-sky-600 mt-1 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    },
    handler: async ({ destinationCountry }) => {
      return getJobSearchResources(destinationCountry);
    },
  });

  // Live Search Tool - Real-time web search via Perplexity API
  useCopilotAction({
    name: "searchLiveData",
    description: `Search the web for real-time, up-to-date migration information using Perplexity AI.
      Use this when users ask about:
      - Current visa policies or recent changes
      - Latest news about immigration in a country
      - Up-to-date requirements or regulations
      - Recent policy changes or announcements
      - Any question requiring current/fresh information

      This uses a quota-limited API, so only use when truly needed for current information.`,
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query describing what information the user needs",
        required: true,
      },
      {
        name: "targetCountry",
        type: "string",
        description: "Optional country to focus the search on",
        required: false,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return (
          <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-black">
            <Sparkles className="animate-pulse text-purple-500" size={20} />
            <span className="font-bold">Searching the web for latest info...</span>
          </div>
        );
      }

      const data = result as LiveSearchResult;
      if (!data) return <></>;

      // Handle error state
      if (data.error) {
        return (
          <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
            <div className="bg-red-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-bold">Search Error</span>
            </div>
            <div className="p-4">
              <p className="text-red-700">{data.message || "An error occurred while searching."}</p>
            </div>
          </div>
        );
      }

      return (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search size={20} />
              <span className="font-bold">Live Search Results</span>
            </div>
            {data.quotaRemaining !== undefined && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {data.quotaRemaining}/{data.quotaLimit} searches remaining
              </span>
            )}
          </div>

          {/* Answer */}
          <div className="p-4 border-b-2 border-gray-200">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap">{data.answer}</p>
            </div>
          </div>

          {/* Sources */}
          {data.sources && data.sources.length > 0 && (
            <div className="p-4 bg-gray-50">
              <p className="font-bold text-sm mb-2 text-gray-600">Sources:</p>
              <div className="space-y-2">
                {data.sources.slice(0, 5).map((source, i) => (
                  <a
                    key={i}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                  >
                    <ExternalLink size={12} className="flex-shrink-0" />
                    <span className="truncate">{source}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="p-2 bg-purple-50 border-t-2 border-purple-200 text-xs text-purple-600 flex items-center gap-1">
            <Sparkles size={12} />
            Powered by Perplexity AI • Real-time web search
          </div>
        </div>
      );
    },
    handler: async ({ query, targetCountry }) => {
      // Call the ADK agent endpoint directly
      const ADK_URL = process.env.NEXT_PUBLIC_ADK_AGENT_URL || "https://tribe-agent.onrender.com";

      try {
        // Build the query with country if provided
        const searchQuery = targetCountry ? `${query} in ${targetCountry}` : query;

        const response = await fetch(`${ADK_URL}/api/live-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            target_country: targetCountry,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            error: true,
            message: `Search failed (${response.status}): ${errorText.slice(0, 200)}`,
          } as LiveSearchResult;
        }

        const result = await response.json();
        return result as LiveSearchResult;
      } catch (error) {
        return {
          error: true,
          message: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        } as LiveSearchResult;
      }
    },
  });
}
