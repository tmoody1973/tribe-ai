/**
 * Visa Requirement API Client (RapidAPI)
 * Story 9.13: Visa Pathway Discovery
 *
 * Uses visa-requirement.p.rapidapi.com for visa data
 * Endpoints:
 * - /v2/visa/map - Get all destinations for a passport
 * - /v2/visa/check - Get detailed visa requirements between two countries
 */

const RAPIDAPI_HOST = "visa-requirement.p.rapidapi.com";
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;
const API_KEY = process.env.RAPIDAPI_VISA_KEY;

// TypeScript types for API responses
export interface VisaDestination {
  country: string;
  countryCode: string;
  visaRequired: boolean;
  visaType: "visa_free" | "visa_on_arrival" | "e_visa" | "embassy_visa" | "eta";
  stayDuration?: number; // days
  notes?: string;
}

export interface VisaMapResponse {
  passport: string;
  totalDestinations: number;
  visaFree: VisaDestination[];
  visaOnArrival: VisaDestination[];
  eVisa: VisaDestination[];
  embassyVisa: VisaDestination[];
}

export interface VisaRequirement {
  origin: string;
  destination: string;
  visaRequired: boolean;
  visaType: string;
  visaTypeDisplay?: string; // Human-readable visa type
  stayDuration?: number;
  requirements: string[];
  processingTime?: string;
  cost?: string;
  validityPeriod?: string;
  multipleEntry?: boolean;
}

export interface PassportRank {
  passport: string;
  rank: number;
  visaFreeScore: number;
  totalDestinations: number;
  difficultyScore: number; // 1-10, higher = more difficult
}

/**
 * Get all visa pathways for a passport (210 destinations)
 * Uses /v2/visa/map endpoint via RapidAPI
 */
export async function getVisaMap(passport: string): Promise<VisaMapResponse> {
  if (!API_KEY) {
    throw new Error("RAPIDAPI_VISA_KEY environment variable not set");
  }

  const url = `${RAPIDAPI_BASE_URL}/v2/visa/map`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ passport }).toString(),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Visa API quota exceeded. Data may be outdated.");
      }
      throw new Error(`Visa API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform RapidAPI response to our format
    // The API returns a map of country codes to visa requirements
    const destinations = Object.entries(data || {}).map(([code, info]: [string, any]) => ({
      country: info.country || code,
      countryCode: code,
      visaRequired: info.category !== "VF" && info.category !== "VOA",
      visaType: mapVisaCategory(info.category),
      stayDuration: info.dur,
      notes: info.text,
    }));

    return {
      passport,
      totalDestinations: destinations.length,
      visaFree: destinations.filter((d) => d.visaType === "visa_free"),
      visaOnArrival: destinations.filter((d) => d.visaType === "visa_on_arrival"),
      eVisa: destinations.filter((d) => d.visaType === "e_visa"),
      embassyVisa: destinations.filter((d) => d.visaType === "embassy_visa"),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch visa map from Visa API");
  }
}

/**
 * Map RapidAPI visa category codes to our visa types
 */
function mapVisaCategory(category: string): "visa_free" | "visa_on_arrival" | "e_visa" | "embassy_visa" | "eta" {
  switch (category?.toUpperCase()) {
    case "VF": return "visa_free";
    case "VOA": return "visa_on_arrival";
    case "EV":
    case "ETA": return "e_visa";
    case "VR":
    default: return "embassy_visa";
  }
}

/**
 * Check detailed visa requirements between two countries
 * Uses /v2/visa/check endpoint via RapidAPI
 */
export async function checkVisaRequirements(
  origin: string,
  destination: string
): Promise<VisaRequirement> {
  if (!API_KEY) {
    throw new Error("RAPIDAPI_VISA_KEY environment variable not set");
  }

  const url = `${RAPIDAPI_BASE_URL}/v2/visa/check`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ passport: origin, destination }).toString(),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Visa API quota exceeded. Data may be outdated.");
      }
      throw new Error(`Visa API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse RapidAPI response format
    const category = data.category || "VR";
    const visaTypeCode = mapVisaCategory(category);
    const visaTypeDisplay = mapVisaCategoryToDisplay(category);

    return {
      origin,
      destination,
      visaRequired: category !== "VF",
      visaType: visaTypeCode, // Use schema-compatible code
      visaTypeDisplay, // Human-readable for display
      stayDuration: data.dur,
      requirements: parseRequirements(data.text, visaTypeDisplay),
      processingTime: data.processingTime,
      cost: data.cost,
      validityPeriod: data.validity,
      multipleEntry: data.multipleEntry,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check visa requirements from Visa API");
  }
}

/**
 * Map RapidAPI category to human-readable display text
 */
function mapVisaCategoryToDisplay(category: string): string {
  switch (category?.toUpperCase()) {
    case "VF": return "Visa Free";
    case "VOA": return "Visa on Arrival";
    case "EV": return "e-Visa";
    case "ETA": return "Electronic Travel Authorization";
    case "VR": return "Visa Required";
    default: return "Visa Required";
  }
}

/**
 * Parse requirements from API text response
 */
function parseRequirements(text: string | undefined, visaType: string): string[] {
  const requirements: string[] = [];

  if (text) {
    requirements.push(text);
  }

  // Add standard requirements based on visa type
  if (visaType === "Visa Required" || visaType === "e-Visa") {
    requirements.push("Valid passport with 6+ months validity");
    requirements.push("Completed visa application form");
    requirements.push("Passport-sized photographs");
    requirements.push("Proof of accommodation");
    requirements.push("Proof of sufficient funds");
  } else if (visaType === "Visa on Arrival") {
    requirements.push("Valid passport with 6+ months validity");
    requirements.push("Return/onward ticket");
    requirements.push("Proof of accommodation");
  }

  return requirements;
}

/**
 * Get passport rank and difficulty score
 * Uses visa map data to calculate rank
 */
export async function getPassportRank(passport: string): Promise<PassportRank> {
  if (!API_KEY) {
    throw new Error("RAPIDAPI_VISA_KEY environment variable not set");
  }

  try {
    // Get visa map to calculate passport strength
    const visaMap = await getVisaMap(passport);
    const visaFreeCount = visaMap.visaFree.length + visaMap.visaOnArrival.length;

    return {
      passport,
      rank: calculateRankFromVisaFree(visaFreeCount),
      visaFreeScore: visaFreeCount,
      totalDestinations: visaMap.totalDestinations,
      difficultyScore: calculateDifficultyScore(visaFreeCount),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get passport rank from Visa API");
  }
}

/**
 * Calculate approximate rank from visa-free access count
 */
function calculateRankFromVisaFree(visaFreeCount: number): number {
  if (visaFreeCount >= 190) return 1;
  if (visaFreeCount >= 180) return 10;
  if (visaFreeCount >= 170) return 20;
  if (visaFreeCount >= 150) return 40;
  if (visaFreeCount >= 120) return 60;
  if (visaFreeCount >= 90) return 80;
  if (visaFreeCount >= 60) return 100;
  if (visaFreeCount >= 40) return 120;
  return 150;
}

/**
 * Calculate difficulty score (1-10) based on visa-free access
 * Higher score = more difficult passport
 */
function calculateDifficultyScore(visaFreeCount: number): number {
  // Most powerful passports have 190+ visa-free access
  // Weakest passports have <50 visa-free access
  if (visaFreeCount >= 180) return 1; // Very easy
  if (visaFreeCount >= 150) return 2;
  if (visaFreeCount >= 120) return 3;
  if (visaFreeCount >= 100) return 4;
  if (visaFreeCount >= 80) return 5;  // Medium
  if (visaFreeCount >= 60) return 6;
  if (visaFreeCount >= 40) return 7;
  if (visaFreeCount >= 25) return 8;
  if (visaFreeCount >= 15) return 9;
  return 10; // Very difficult
}

/**
 * Check if API quota is available
 * Returns true if we can make more API calls this month
 */
export function hasQuotaAvailable(callsThisMonth: number): boolean {
  const FREE_TIER_LIMIT = 120;
  return callsThisMonth < FREE_TIER_LIMIT;
}

/**
 * Calculate days until quota reset (1st of next month)
 */
export function daysUntilQuotaReset(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diffTime = nextMonth.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
