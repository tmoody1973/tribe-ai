"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import {
  searchTemporaryHousing,
  compareCostOfLiving,
  findExpatCommunities,
  checkVisaResources,
  getHealthcareInfo,
} from "@/lib/tools/migrationTools";

export function useMigrationTools() {
  // Housing Search Tool
  useCopilotAction({
    name: "searchTemporaryHousing",
    description: `Search for temporary housing (Airbnb, Booking.com, Vrbo, etc.) for users relocating to a new country.
      Returns deep links to multiple housing platforms optimized for monthly stays.
      Use when users need accommodation during migration or relocation.
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
    handler: async ({ city, country, guests, stayType }) => {
      const result = searchTemporaryHousing({
        city,
        country,
        guests: guests || 1,
        stayType: (stayType as "short" | "monthly" | "long_term") || "monthly",
      });

      // Format the response for the AI to present nicely
      const platformList = result.platforms
        .map((p) => `**${p.name}**: [Search ${city}](${p.url})\n   - ${p.bestFor}`)
        .join("\n\n");

      const tipsList = result.tips.map((t) => `- ${t}`).join("\n");

      return `## Housing Options in ${city}, ${country}\n\n${platformList}\n\n### Tips for Finding Housing:\n${tipsList}`;
    },
  });

  // Cost of Living Comparison Tool
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
    handler: async ({
      originCity,
      originCountry,
      destinationCity,
      destinationCountry,
    }) => {
      const result = compareCostOfLiving(
        originCity,
        originCountry,
        destinationCity,
        destinationCountry
      );

      return `## Cost of Living: ${originCity} vs ${destinationCity}

**Compare on Numbeo:** [View Comparison](${result.comparison.numbeoUrl})

**Compare on Expatistan:** [View Comparison](${result.comparison.expatistanUrl})

${result.note}

These tools show detailed breakdowns of:
- Rent prices
- Groceries
- Restaurant costs
- Transportation
- Utilities
- And more...`;
    },
  });

  // Expat Community Finder Tool
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
    handler: async ({ city, country }) => {
      const result = findExpatCommunities(city, country);

      const communityList = result.communities
        .map((c) => `**${c.platform}**: [Join](${c.url})\n   - ${c.type}`)
        .join("\n\n");

      return `## Expat Communities in ${city}, ${country}\n\n${communityList}\n\n### Tips for Building Community:\n- Join groups before you arrive to ask questions\n- Attend in-person meetups within your first month\n- Look for communities specific to your interests or profession`;
    },
  });

  // Visa Resources Tool
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
    handler: async ({ passportCountry, destinationCountry, purposeOfStay }) => {
      const result = checkVisaResources(
        passportCountry,
        destinationCountry,
        (purposeOfStay as "tourism" | "work" | "study" | "digital_nomad" | "retirement") || "work"
      );

      const resourceList = result.resources
        .map((r) => `**${r.name}**: [Visit](${r.url})\n   - ${r.description}`)
        .join("\n\n");

      return `## Visa Resources: ${passportCountry} → ${destinationCountry}\n\n${resourceList}\n\n⚠️ **Important:** ${result.disclaimer}`;
    },
  });

  // Healthcare Info Tool
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
    handler: async ({ destinationCountry, stayDuration }) => {
      const result = getHealthcareInfo(
        destinationCountry,
        (stayDuration as "short_term" | "long_term" | "permanent") || "long_term"
      );

      const resourceList = result.resources
        .map((r) => `**${r.name}**: [Visit](${r.url})\n   - ${r.description}`)
        .join("\n\n");

      const considerationsList = result.considerations.map((c) => `- ${c}`).join("\n");

      return `## Healthcare Options for ${destinationCountry}\n\n${resourceList}\n\n### Key Considerations:\n${considerationsList}`;
    },
  });
}
