/**
 * Travel Buddy API v2 Client
 * Story 9.13: Visa Pathway Discovery
 *
 * Free tier: 120 requests/month
 * Endpoints:
 * - /v2/visa/map - Get all 210 destinations for a passport
 * - /v2/visa/check - Get detailed visa requirements between two countries
 * - /v2/passport/rank/custom - Get passport difficulty score
 */

const TRAVEL_BUDDY_BASE_URL = "https://travel-buddy.ai/api";
const API_KEY = process.env.TRAVEL_BUDDY_API_KEY;

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
 * Uses /v2/visa/map endpoint
 */
export async function getVisaMap(passport: string): Promise<VisaMapResponse> {
  if (!API_KEY) {
    throw new Error("TRAVEL_BUDDY_API_KEY environment variable not set");
  }

  const url = `${TRAVEL_BUDDY_BASE_URL}/v2/visa/map?passport=${encodeURIComponent(passport)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Travel Buddy API quota exceeded. Data may be outdated.");
      }
      throw new Error(`Travel Buddy API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to our format
    return {
      passport,
      totalDestinations: data.destinations?.length || 0,
      visaFree: data.destinations?.filter((d: any) => d.visaType === "visa_free") || [],
      visaOnArrival: data.destinations?.filter((d: any) => d.visaType === "visa_on_arrival") || [],
      eVisa: data.destinations?.filter((d: any) => d.visaType === "e_visa" || d.visaType === "eta") || [],
      embassyVisa: data.destinations?.filter((d: any) => d.visaType === "embassy_visa") || [],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch visa map from Travel Buddy API");
  }
}

/**
 * Check detailed visa requirements between two countries
 * Uses /v2/visa/check endpoint
 */
export async function checkVisaRequirements(
  origin: string,
  destination: string
): Promise<VisaRequirement> {
  if (!API_KEY) {
    throw new Error("TRAVEL_BUDDY_API_KEY environment variable not set");
  }

  const url = `${TRAVEL_BUDDY_BASE_URL}/v2/visa/check?passport=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Travel Buddy API quota exceeded. Data may be outdated.");
      }
      throw new Error(`Travel Buddy API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      origin,
      destination,
      visaRequired: data.visaRequired || false,
      visaType: data.visaType || "unknown",
      stayDuration: data.stayDuration,
      requirements: data.requirements || [],
      processingTime: data.processingTime,
      cost: data.cost,
      validityPeriod: data.validityPeriod,
      multipleEntry: data.multipleEntry,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check visa requirements from Travel Buddy API");
  }
}

/**
 * Get passport rank and difficulty score
 * Uses /v2/passport/rank/custom endpoint
 */
export async function getPassportRank(passport: string): Promise<PassportRank> {
  if (!API_KEY) {
    throw new Error("TRAVEL_BUDDY_API_KEY environment variable not set");
  }

  const url = `${TRAVEL_BUDDY_BASE_URL}/v2/passport/rank/custom?passport=${encodeURIComponent(
    passport
  )}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Travel Buddy API quota exceeded. Data may be outdated.");
      }
      throw new Error(`Travel Buddy API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      passport,
      rank: data.rank || 0,
      visaFreeScore: data.visaFreeScore || 0,
      totalDestinations: data.totalDestinations || 0,
      difficultyScore: calculateDifficultyScore(data.visaFreeScore || 0),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get passport rank from Travel Buddy API");
  }
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
