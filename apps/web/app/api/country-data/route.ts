import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "94bd6255cemshf02b5c2af7c0c6ep1d606ajsn6c7e7d35ca45";
const RAPIDAPI_HOST = "cost-of-living-and-prices.p.rapidapi.com";

// Major cities for each country (for TravelTables lookup)
const countryMainCities: Record<string, string> = {
  DE: "Berlin",
  US: "New York",
  CA: "Toronto",
  AU: "Sydney",
  GB: "London",
  NL: "Amsterdam",
  SG: "Singapore",
  AE: "Dubai",
  FR: "Paris",
  ES: "Madrid",
  JP: "Tokyo",
  KR: "Seoul",
  BR: "Sao Paulo",
  IN: "Mumbai",
  NG: "Lagos",
};

interface TravelTablesCityData {
  cityName: string;
  costOfLivingIndex: number;
  rentIndex: number;
  groceriesIndex: number;
  restaurantPriceIndex: number;
  localPurchasingPower: number;
}

interface TravelTablesPrices {
  prices: {
    item_name: string;
    avg: number;
    min: number;
    max: number;
  }[];
}

interface CountryDataResponse {
  code: string;
  name: string;
  capital: string;
  population: string;
  currency: string;
  currencyCode: string;
  language: string;
  otherLanguages?: string[];
  timezone: string;
  metrics: {
    costOfLivingIndex: number;
    averageRentUSD: number;
    safetyIndex: number;
    healthcareIndex: number;
    qualityOfLifeIndex: number;
    englishProficiency: string;
    averageSalaryUSD: number;
    minimumWageUSD: number;
    unemploymentRate: number;
  };
  cities: {
    name: string;
    population: string;
    description: string;
    highlights: string[];
  }[];
  advantages: string[];
  challenges: string[];
  visaOptions: {
    name: string;
    type: string;
    processingTime: string;
    duration: string;
    requirements: string[];
  }[];
  workCulture: string;
  livingTips: string[];
  dataSource?: string;
  recentNews?: string[];
  visaUpdates?: string[];
}

async function fetchWithPerplexity(countryName: string): Promise<Partial<CountryDataResponse>> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are a migration data researcher. Return ONLY valid JSON with accurate, current data about countries for migrants. Use real statistics from reliable sources like World Bank, OECD, Numbeo, government sites.`,
        },
        {
          role: "user",
          content: `Provide comprehensive migration data for ${countryName}. Return JSON with this exact structure:
{
  "capital": "Capital city name",
  "population": "e.g., 84 million",
  "currency": "Currency name",
  "currencyCode": "3-letter code",
  "language": "Official language(s)",
  "otherLanguages": ["Other commonly spoken languages"],
  "timezone": "Primary timezone",
  "metrics": {
    "costOfLivingIndex": <number 0-100, NYC=100>,
    "averageRentUSD": <monthly rent for 1BR in city center>,
    "safetyIndex": <0-100>,
    "healthcareIndex": <0-100>,
    "qualityOfLifeIndex": <0-100>,
    "englishProficiency": "native|high|moderate|low",
    "averageSalaryUSD": <annual in USD>,
    "minimumWageUSD": <annual in USD, 0 if none>,
    "unemploymentRate": <percentage>
  },
  "cities": [
    {"name": "City", "population": "X million", "description": "Brief appeal for migrants", "highlights": ["4 key points"]}
  ],
  "advantages": ["6 key advantages for migrants"],
  "challenges": ["6 key challenges for migrants"],
  "visaOptions": [
    {"name": "Visa name", "type": "work|student|family|investor|digital_nomad", "processingTime": "X weeks/months", "duration": "X years", "requirements": ["key requirements"]}
  ],
  "workCulture": "2-3 sentences about workplace norms",
  "livingTips": ["5 essential tips for new arrivals"]
}

Include the 3 top visa options for skilled workers. Focus on practical, actionable information for migrants.`,
        },
      ],
      max_tokens: 2000,
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

// Fetch cost of living data from TravelTables (RapidAPI)
async function fetchTravelTablesData(countryCode: string): Promise<{
  costOfLivingIndex?: number;
  rentIndex?: number;
  averageRentUSD?: number;
  groceriesIndex?: number;
  restaurantIndex?: number;
  purchasingPower?: number;
} | null> {
  const cityName = countryMainCities[countryCode.toUpperCase()];
  if (!cityName) return null;

  try {
    // Fetch city cost indices
    const indexResponse = await fetch(
      `https://${RAPIDAPI_HOST}/cities?city_name=${encodeURIComponent(cityName)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!indexResponse.ok) {
      console.error("TravelTables index API error:", indexResponse.status);
      return null;
    }

    const indexData: TravelTablesCityData[] = await indexResponse.json();
    const cityData = indexData[0]; // Get first matching city

    if (!cityData) return null;

    // Fetch detailed prices for rent calculation
    const pricesResponse = await fetch(
      `https://${RAPIDAPI_HOST}/prices?city_name=${encodeURIComponent(cityName)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    let averageRent = 0;
    if (pricesResponse.ok) {
      const pricesData: TravelTablesPrices = await pricesResponse.json();
      // Find 1-bedroom apartment rent
      const rentItem = pricesData.prices?.find(
        (p) => p.item_name.toLowerCase().includes("apartment") &&
               p.item_name.toLowerCase().includes("1 bedroom") &&
               p.item_name.toLowerCase().includes("centre")
      );
      if (rentItem) {
        averageRent = Math.round(rentItem.avg);
      }
    }

    return {
      costOfLivingIndex: Math.round(cityData.costOfLivingIndex),
      rentIndex: Math.round(cityData.rentIndex),
      averageRentUSD: averageRent,
      groceriesIndex: Math.round(cityData.groceriesIndex),
      restaurantIndex: Math.round(cityData.restaurantPriceIndex),
      purchasingPower: Math.round(cityData.localPurchasingPower),
    };
  } catch (error) {
    console.error("TravelTables API error:", error);
    return null;
  }
}

async function enrichWithTavily(countryName: string): Promise<{
  recentNews: string[];
  visaUpdates: string[];
}> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: `${countryName} immigration visa requirements updates 2025`,
      search_depth: "advanced",
      include_answer: true,
      max_results: 5,
    }),
  });

  if (!response.ok) {
    console.error("Tavily API error:", response.status);
    return { recentNews: [], visaUpdates: [] };
  }

  const data = await response.json();

  const recentNews = data.results?.slice(0, 3).map((r: { title: string }) => r.title) || [];
  const visaUpdates = data.answer ? [data.answer] : [];

  return { recentNews, visaUpdates };
}

// Fallback static data for when APIs are unavailable
const staticCountryData: Record<string, Partial<CountryDataResponse>> = {
  DE: {
    capital: "Berlin",
    population: "84.5 million",
    currency: "Euro",
    currencyCode: "EUR",
    language: "German",
    otherLanguages: ["English (widely spoken in business)"],
    timezone: "CET (UTC+1)",
    metrics: {
      costOfLivingIndex: 65,
      averageRentUSD: 1200,
      safetyIndex: 80,
      healthcareIndex: 89,
      qualityOfLifeIndex: 82,
      englishProficiency: "high",
      averageSalaryUSD: 62000,
      minimumWageUSD: 24000,
      unemploymentRate: 5.7,
    },
    cities: [
      { name: "Berlin", population: "3.8M", description: "Vibrant startup hub with affordable rents", highlights: ["Tech scene", "Nightlife", "Affordable", "International"] },
      { name: "Munich", population: "1.5M", description: "High quality of life, strong job market", highlights: ["High salaries", "Beautiful scenery", "Traditional"] },
      { name: "Frankfurt", population: "750K", description: "Financial hub with excellent connections", highlights: ["Banking sector", "Airport hub", "Diverse"] },
    ],
    advantages: ["Strong economy", "Free university education", "Universal healthcare", "Central European location", "Strong worker protections", "High quality of life"],
    challenges: ["German language essential", "Bureaucracy can be slow", "Housing shortage in cities", "Cold winters", "Direct communication style", "Shops closed Sundays"],
    visaOptions: [
      { name: "EU Blue Card", type: "work", processingTime: "4-12 weeks", duration: "Up to 4 years", requirements: ["University degree", "Job offer €45,300+", "Valid passport", "Health insurance"] },
      { name: "Job Seeker Visa", type: "work", processingTime: "4-8 weeks", duration: "6 months", requirements: ["University degree", "Sufficient funds", "Valid passport"] },
    ],
    workCulture: "German workplaces value punctuality, efficiency, and direct communication. Work-life balance is respected with 30+ vacation days.",
    livingTips: ["Register address within 2 weeks", "Learn basic German", "Get liability insurance", "Open German bank account", "Recycle properly"],
  },
  US: {
    capital: "Washington, D.C.",
    population: "335 million",
    currency: "US Dollar",
    currencyCode: "USD",
    language: "English",
    otherLanguages: ["Spanish (widely spoken)"],
    timezone: "Multiple (UTC-5 to UTC-10)",
    metrics: {
      costOfLivingIndex: 100,
      averageRentUSD: 2500,
      safetyIndex: 55,
      healthcareIndex: 69,
      qualityOfLifeIndex: 71,
      englishProficiency: "native",
      averageSalaryUSD: 77000,
      minimumWageUSD: 15000,
      unemploymentRate: 3.7,
    },
    cities: [
      { name: "New York City", population: "8.3M", description: "Global financial and cultural capital", highlights: ["Finance", "Media", "Arts", "Diverse"] },
      { name: "San Francisco", population: "870K", description: "Tech capital with high salaries", highlights: ["Tech hub", "Innovation", "Mild weather"] },
      { name: "Austin", population: "1M", description: "Growing tech hub with no state income tax", highlights: ["No state tax", "Music scene", "Growing tech"] },
    ],
    advantages: ["Highest tech/finance salaries", "World-leading universities", "Diverse society", "Entrepreneurship-friendly", "Strong job market", "Cultural influence"],
    challenges: ["Expensive healthcare", "Complex visa process", "Safety concerns in some areas", "Limited public transit", "Demanding work culture", "High cost in major metros"],
    visaOptions: [
      { name: "H-1B Work Visa", type: "work", processingTime: "3-6 months", duration: "3 years (ext. to 6)", requirements: ["Bachelor's degree", "Specialty job offer", "Employer sponsorship", "Lottery selection"] },
      { name: "F-1 Student Visa", type: "student", processingTime: "3-5 weeks", duration: "Duration of study", requirements: ["School acceptance", "Financial proof", "Valid passport"] },
    ],
    workCulture: "American workplaces are informal and results-oriented. Networking is key. Work hours can be long. Direct communication and initiative are valued.",
    livingTips: ["Get health insurance immediately", "Build credit history", "Get Social Security Number", "Learn to drive", "Tip 15-20% at restaurants"],
  },
  CA: {
    capital: "Ottawa",
    population: "40 million",
    currency: "Canadian Dollar",
    currencyCode: "CAD",
    language: "English, French",
    timezone: "Multiple (UTC-3.5 to UTC-8)",
    metrics: {
      costOfLivingIndex: 67,
      averageRentUSD: 1800,
      safetyIndex: 82,
      healthcareIndex: 72,
      qualityOfLifeIndex: 81,
      englishProficiency: "native",
      averageSalaryUSD: 55000,
      minimumWageUSD: 24000,
      unemploymentRate: 5.4,
    },
    cities: [
      { name: "Toronto", population: "2.9M", description: "Canada's largest city and financial hub", highlights: ["Finance", "Tech", "Multicultural", "Arts"] },
      { name: "Vancouver", population: "675K", description: "Pacific gateway with stunning nature", highlights: ["Nature", "Film industry", "Mild climate"] },
      { name: "Montreal", population: "1.8M", description: "French-speaking cultural hub", highlights: ["Affordable", "Culture", "Food scene", "Bilingual"] },
    ],
    advantages: ["Clear immigration pathways", "Universal healthcare", "Welcoming multicultural society", "High quality of life", "Strong worker protections", "Path to citizenship (3 years)"],
    challenges: ["Cold winters", "Credential recognition delays", "Housing expensive in cities", "Lower salaries than US", "French required in Quebec", "Healthcare wait times"],
    visaOptions: [
      { name: "Express Entry", type: "work", processingTime: "6-12 months", duration: "Permanent Residence", requirements: ["CRS score 450-500+", "Language test", "Education assessment", "Work experience"] },
      { name: "Study Permit", type: "student", processingTime: "4-16 weeks", duration: "Duration of study", requirements: ["Acceptance to DLI", "Proof of funds", "Clean record"] },
    ],
    workCulture: "Canadian workplaces are collaborative and polite. Work-life balance is valued with 2-3 weeks vacation. Diversity and inclusion are emphasized.",
    livingTips: ["Apply for SIN immediately", "Get provincial health card", "Invest in winter gear", "Open bank account for credit history", "Get driver's license outside cities"],
  },
  AU: {
    capital: "Canberra",
    population: "27 million",
    currency: "Australian Dollar",
    currencyCode: "AUD",
    language: "English",
    timezone: "Multiple (UTC+8 to UTC+11)",
    metrics: {
      costOfLivingIndex: 73,
      averageRentUSD: 2200,
      safetyIndex: 78,
      healthcareIndex: 80,
      qualityOfLifeIndex: 83,
      englishProficiency: "native",
      averageSalaryUSD: 64000,
      minimumWageUSD: 31000,
      unemploymentRate: 4.2,
    },
    cities: [
      { name: "Sydney", population: "5.4M", description: "Australia's largest city with iconic harbor", highlights: ["Finance", "Beaches", "Diverse", "Iconic"] },
      { name: "Melbourne", population: "5.1M", description: "Cultural capital known for arts and coffee", highlights: ["Culture", "Coffee", "Arts", "Sports"] },
      { name: "Brisbane", population: "2.6M", description: "Sunny Queensland capital", highlights: ["Sunshine", "Affordable", "Outdoor lifestyle"] },
    ],
    advantages: ["High minimum wage ($24.10 AUD/hr)", "Great weather and lifestyle", "Strong economy", "Universal Medicare", "Transparent visa system", "Multicultural (30% foreign-born)"],
    challenges: ["Far from other continents", "Dangerous wildlife", "High cost in major cities", "Slow visa processing", "Intense sun", "Regional areas limited services"],
    visaOptions: [
      { name: "Skilled Independent (189)", type: "work", processingTime: "6-12 months", duration: "Permanent", requirements: ["Skilled occupation list", "65+ points", "Skills assessment", "IELTS 6.0+"] },
      { name: "Working Holiday (417/462)", type: "work", processingTime: "2-4 weeks", duration: "1 year", requirements: ["18-30 years", "Eligible passport", "No dependents", "AUD $5,000 funds"] },
    ],
    workCulture: "Australian workplaces are egalitarian and informal. Work-life balance is valued - leaving at 5 PM is normal. Casual Fridays are common.",
    livingTips: ["Get Tax File Number within 28 days", "Superannuation is mandatory (11.5%)", "Apply for Medicare card", "Sun protection essential", "Learn wildlife safety"],
  },
  GB: {
    capital: "London",
    population: "67 million",
    currency: "British Pound",
    currencyCode: "GBP",
    language: "English",
    timezone: "GMT (UTC+0)",
    metrics: {
      costOfLivingIndex: 75,
      averageRentUSD: 2100,
      safetyIndex: 75,
      healthcareIndex: 74,
      qualityOfLifeIndex: 77,
      englishProficiency: "native",
      averageSalaryUSD: 52000,
      minimumWageUSD: 25000,
      unemploymentRate: 4.0,
    },
    cities: [
      { name: "London", population: "9M", description: "Global financial center with cultural offerings", highlights: ["Finance", "Culture", "Diverse", "History"] },
      { name: "Manchester", population: "550K", description: "Northern powerhouse with tech scene", highlights: ["Tech hub", "Football", "Music", "Affordable"] },
      { name: "Edinburgh", population: "540K", description: "Scotland's capital with stunning architecture", highlights: ["History", "Festivals", "Nature", "Universities"] },
    ],
    advantages: ["English-speaking", "Free NHS healthcare", "World-class universities", "Rich history and culture", "Strong legal/financial sectors", "Gateway to Europe"],
    challenges: ["High London living costs", "Grey, rainy weather", "Post-Brexit visa complexity", "Small living spaces", "NHS wait times", "Work-life balance varies"],
    visaOptions: [
      { name: "Skilled Worker Visa", type: "work", processingTime: "3 weeks", duration: "Up to 5 years", requirements: ["Licensed sponsor job", "Min salary £26,200+", "English B1", "Eligible occupation"] },
      { name: "Global Talent Visa", type: "work", processingTime: "3-8 weeks", duration: "Up to 5 years", requirements: ["Endorsement from approved body", "Exceptional talent", "Science/engineering/arts/tech"] },
    ],
    workCulture: "British workplaces value professionalism with humor. Communication can be indirect. Tea breaks are cultural. Post-work pub is common networking.",
    livingTips: ["Get National Insurance Number", "Register with GP for NHS", "Oyster/contactless for London", "Carry umbrella always", "Budget for Council Tax"],
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get("code");
  const countryName = searchParams.get("name");

  if (!countryCode || !countryName) {
    return NextResponse.json(
      { error: "Country code and name required" },
      { status: 400 }
    );
  }

  const upperCode = countryCode.toUpperCase();

  try {
    // Check cache first (30-day TTL)
    const cacheKey = `country_data_${upperCode}`;
    const cached = await convex.query(api.cache.get, { key: cacheKey });

    if (cached && cached.data && !cached.expired) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cachedAt: cached.cachedAt,
      });
    }

    // Check if we have API keys configured
    const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;

    if (!hasPerplexityKey) {
      // Use static fallback data
      const staticData = staticCountryData[upperCode];
      if (staticData) {
        return NextResponse.json({
          code: upperCode,
          name: countryName,
          ...staticData,
          cached: false,
          dataSource: "curated",
        });
      }
    }

    // Fetch fresh data from Perplexity + Tavily + TravelTables in parallel
    const [perplexityData, tavilyData, travelTablesData] = await Promise.all([
      fetchWithPerplexity(countryName).catch((e) => {
        console.error("Perplexity error:", e);
        return staticCountryData[upperCode] || {};
      }),
      enrichWithTavily(countryName).catch(() => ({ recentNews: [], visaUpdates: [] })),
      fetchTravelTablesData(countryCode).catch(() => null),
    ]);

    // Merge data, prioritizing TravelTables for cost metrics (more accurate)
    const metrics = {
      ...perplexityData.metrics,
      // Override with TravelTables data if available (more accurate real-time data)
      ...(travelTablesData && {
        costOfLivingIndex: travelTablesData.costOfLivingIndex || perplexityData.metrics?.costOfLivingIndex,
        rentIndex: travelTablesData.rentIndex,
        averageRentUSD: travelTablesData.averageRentUSD || perplexityData.metrics?.averageRentUSD,
        groceriesIndex: travelTablesData.groceriesIndex,
        restaurantIndex: travelTablesData.restaurantIndex,
        purchasingPower: travelTablesData.purchasingPower,
      }),
    };

    const countryData: CountryDataResponse = {
      code: upperCode,
      name: countryName,
      ...perplexityData,
      metrics,
      ...tavilyData,
      dataSource: travelTablesData ? "TravelTables + Perplexity" : "Perplexity",
    } as CountryDataResponse;

    // Cache the result (30 days)
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    try {
      await convex.mutation(api.cache.set, {
        key: cacheKey,
        data: countryData,
        ttlMs: THIRTY_DAYS_MS,
      });
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
    }

    return NextResponse.json({
      ...countryData,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching country data:", error);

    // Return static data as fallback
    const staticData = staticCountryData[upperCode];
    if (staticData) {
      return NextResponse.json({
        code: upperCode,
        name: countryName,
        ...staticData,
        cached: false,
        dataSource: "curated (fallback)",
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch country data" },
      { status: 500 }
    );
  }
}
