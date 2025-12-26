import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface EmergencyInfoResponse {
  origin: string;
  destination: string;
  emergencyNumber: string;
  policeNumber: string;
  ambulanceNumber: string;
  fireNumber: string;
  embassy: {
    name: string;
    phone: string;
    address: string;
    email: string;
    website?: string;
    hours?: string;
  };
  phrases: {
    phrase: string;
    meaning: string;
    pronunciation?: string;
  }[];
  healthcareInfo: string;
  healthcareEmergency?: string;
  migrantHelpline?: string;
  mentalHealthHotline?: string;
  domesticViolenceHotline?: string;
  localEmergencyApp?: string;
  insuranceInfo?: string;
  sourceUrls?: string[];
  confidence?: string;
}

// Known emergency numbers by country (well-established, don't need AI for these)
const knownEmergencyNumbers: Record<string, { emergency: string; police: string; ambulance: string; fire: string }> = {
  "United States": { emergency: "911", police: "911", ambulance: "911", fire: "911" },
  "Canada": { emergency: "911", police: "911", ambulance: "911", fire: "911" },
  "United Kingdom": { emergency: "999", police: "999 or 101", ambulance: "999", fire: "999" },
  "Australia": { emergency: "000", police: "000 or 131 444", ambulance: "000", fire: "000" },
  "Germany": { emergency: "112", police: "110", ambulance: "112", fire: "112" },
  "France": { emergency: "112", police: "17", ambulance: "15", fire: "18" },
  "Japan": { emergency: "110/119", police: "110", ambulance: "119", fire: "119" },
  "South Korea": { emergency: "112/119", police: "112", ambulance: "119", fire: "119" },
  "China": { emergency: "110/120/119", police: "110", ambulance: "120", fire: "119" },
  "India": { emergency: "112", police: "100", ambulance: "102/108", fire: "101" },
  "Brazil": { emergency: "190/192/193", police: "190", ambulance: "192", fire: "193" },
  "Mexico": { emergency: "911", police: "911", ambulance: "911", fire: "911" },
  "Netherlands": { emergency: "112", police: "112 or 0900-8844", ambulance: "112", fire: "112" },
  "Spain": { emergency: "112", police: "091 or 112", ambulance: "112", fire: "112" },
  "Italy": { emergency: "112", police: "113", ambulance: "118", fire: "115" },
  "Singapore": { emergency: "999/995", police: "999", ambulance: "995", fire: "995" },
  "UAE": { emergency: "999", police: "999", ambulance: "998", fire: "997" },
  "New Zealand": { emergency: "111", police: "111", ambulance: "111", fire: "111" },
  "South Africa": { emergency: "10111/10177", police: "10111", ambulance: "10177", fire: "10177" },
  "Thailand": { emergency: "191/1669", police: "191", ambulance: "1669", fire: "199" },
  "Philippines": { emergency: "911", police: "911", ambulance: "911", fire: "911" },
  "Vietnam": { emergency: "113/115", police: "113", ambulance: "115", fire: "114" },
  "Indonesia": { emergency: "110/118/113", police: "110", ambulance: "118", fire: "113" },
  "Malaysia": { emergency: "999", police: "999", ambulance: "999", fire: "994" },
  "Nigeria": { emergency: "199/112", police: "199", ambulance: "112", fire: "199" },
  "Kenya": { emergency: "999/112", police: "999", ambulance: "999", fire: "999" },
  "Egypt": { emergency: "122/123", police: "122", ambulance: "123", fire: "180" },
  "Saudi Arabia": { emergency: "911", police: "911", ambulance: "997", fire: "998" },
  "Turkey": { emergency: "112", police: "155", ambulance: "112", fire: "110" },
  "Russia": { emergency: "112", police: "102", ambulance: "103", fire: "101" },
  "Poland": { emergency: "112", police: "997", ambulance: "999", fire: "998" },
  "Sweden": { emergency: "112", police: "112", ambulance: "112", fire: "112" },
  "Norway": { emergency: "112/113/110", police: "112", ambulance: "113", fire: "110" },
  "Denmark": { emergency: "112", police: "112", ambulance: "112", fire: "112" },
  "Finland": { emergency: "112", police: "112", ambulance: "112", fire: "112" },
  "Switzerland": { emergency: "112", police: "117", ambulance: "144", fire: "118" },
  "Austria": { emergency: "112", police: "133", ambulance: "144", fire: "122" },
  "Belgium": { emergency: "112", police: "101", ambulance: "100", fire: "100" },
  "Portugal": { emergency: "112", police: "112", ambulance: "112", fire: "112" },
  "Greece": { emergency: "112", police: "100", ambulance: "166", fire: "199" },
  "Ireland": { emergency: "999/112", police: "999/112", ambulance: "999/112", fire: "999/112" },
  "Czech Republic": { emergency: "112", police: "158", ambulance: "155", fire: "150" },
  "Argentina": { emergency: "911", police: "911", ambulance: "107", fire: "100" },
  "Chile": { emergency: "131/133", police: "133", ambulance: "131", fire: "132" },
  "Colombia": { emergency: "123", police: "123", ambulance: "123", fire: "123" },
  "Peru": { emergency: "105/116", police: "105", ambulance: "116", fire: "116" },
};

async function fetchEmergencyInfoWithAI(
  origin: string,
  destination: string
): Promise<Partial<EmergencyInfoResponse>> {
  // Use Perplexity for real-time research
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are a migration emergency information researcher. Return ONLY valid JSON with accurate, current emergency contact data. Prioritize official government and embassy sources.`,
        },
        {
          role: "user",
          content: `Provide emergency information for someone from ${origin} living in/traveling to ${destination}. Return JSON:
{
  "embassy": {
    "name": "${origin} Embassy/Consulate in ${destination}",
    "phone": "Actual phone number with country code",
    "address": "Full street address of main embassy or consulate",
    "email": "Official email if available, otherwise 'Contact via website'",
    "website": "Official embassy website URL",
    "hours": "Operating hours or 'Contact for hours'"
  },
  "phrases": [
    {"phrase": "Emergency phrase in ${destination}'s local language", "meaning": "English meaning", "pronunciation": "Phonetic pronunciation guide"}
  ],
  "healthcareInfo": "Brief overview of healthcare system for foreigners/visitors (2-3 sentences)",
  "healthcareEmergency": "How to access emergency care as a foreigner",
  "migrantHelpline": "Migrant support hotline if exists",
  "mentalHealthHotline": "Mental health crisis line",
  "domesticViolenceHotline": "DV hotline if available",
  "localEmergencyApp": "Official emergency app name if exists (e.g., '112 app' in EU)",
  "insuranceInfo": "Key insurance info for visitors/migrants",
  "sourceUrls": ["URL sources for verification"]
}

Include 6-8 essential emergency phrases in the local language (Help, Police, Hospital, I need a doctor, Call emergency, Where is...?, I'm lost, etc.).
For embassy, find the ACTUAL ${origin} embassy or consulate in ${destination}'s capital or main city.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Perplexity response");
  }

  return JSON.parse(jsonMatch[0]);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination required" },
      { status: 400 }
    );
  }

  try {
    // Check Convex cache first
    const cached = await convex.query(api.emergencyInfo.getEmergencyInfo, {
      origin,
      destination,
    });

    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Get known emergency numbers (these don't need AI)
    const knownNumbers = knownEmergencyNumbers[destination] || {
      emergency: "112", // EU default
      police: "112",
      ambulance: "112",
      fire: "112",
    };

    // Check if we have Perplexity API key
    if (!process.env.PERPLEXITY_API_KEY) {
      // Return basic data without AI research
      const basicData: EmergencyInfoResponse = {
        origin,
        destination,
        emergencyNumber: knownNumbers.emergency,
        policeNumber: knownNumbers.police,
        ambulanceNumber: knownNumbers.ambulance,
        fireNumber: knownNumbers.fire,
        embassy: {
          name: `${origin} Embassy in ${destination}`,
          phone: `Search: "${origin} embassy ${destination} phone"`,
          address: `Search: "${origin} embassy ${destination} address"`,
          email: "Contact via embassy website",
        },
        phrases: [
          { phrase: "Help!", meaning: "Help!" },
          { phrase: "Police!", meaning: "Police!" },
          { phrase: "Hospital", meaning: "Hospital" },
          { phrase: "Emergency", meaning: "Emergency" },
        ],
        healthcareInfo: "Research local healthcare system and get travel insurance before arrival.",
        confidence: "low",
      };

      return NextResponse.json({
        ...basicData,
        cached: false,
        dataSource: "basic",
      });
    }

    // Fetch detailed info from AI
    const aiData = await fetchEmergencyInfoWithAI(origin, destination);

    // Merge with known numbers (AI might have more context, but known numbers are reliable)
    const fullData: EmergencyInfoResponse = {
      origin,
      destination,
      emergencyNumber: knownNumbers.emergency,
      policeNumber: knownNumbers.police,
      ambulanceNumber: knownNumbers.ambulance,
      fireNumber: knownNumbers.fire,
      embassy: aiData.embassy || {
        name: `${origin} Embassy in ${destination}`,
        phone: "Search online",
        address: "Search online",
        email: "Contact via website",
      },
      phrases: aiData.phrases || [
        { phrase: "Help!", meaning: "Help!" },
        { phrase: "Emergency", meaning: "Emergency" },
      ],
      healthcareInfo: aiData.healthcareInfo || "Research local healthcare system.",
      healthcareEmergency: aiData.healthcareEmergency,
      migrantHelpline: aiData.migrantHelpline,
      mentalHealthHotline: aiData.mentalHealthHotline,
      domesticViolenceHotline: aiData.domesticViolenceHotline,
      localEmergencyApp: aiData.localEmergencyApp,
      insuranceInfo: aiData.insuranceInfo,
      sourceUrls: aiData.sourceUrls,
      confidence: "high",
    };

    // Cache the result in Convex
    try {
      await convex.mutation(api.emergencyInfo.saveEmergencyInfo, fullData);
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
    }

    return NextResponse.json({
      ...fullData,
      cached: false,
      dataSource: "Perplexity AI",
    });
  } catch (error) {
    console.error("Error fetching emergency info:", error);

    // Return basic fallback
    const knownNumbers = knownEmergencyNumbers[destination] || {
      emergency: "112",
      police: "112",
      ambulance: "112",
      fire: "112",
    };

    return NextResponse.json({
      origin,
      destination,
      emergencyNumber: knownNumbers.emergency,
      policeNumber: knownNumbers.police,
      ambulanceNumber: knownNumbers.ambulance,
      fireNumber: knownNumbers.fire,
      embassy: {
        name: `${origin} Embassy in ${destination}`,
        phone: `Search: "${origin} embassy ${destination}"`,
        address: "Search online for address",
        email: "Contact via embassy website",
      },
      phrases: [
        { phrase: "Help!", meaning: "Help!" },
        { phrase: "Emergency", meaning: "Emergency" },
      ],
      healthcareInfo: "Research local healthcare before traveling.",
      cached: false,
      dataSource: "fallback",
      confidence: "low",
    });
  }
}
