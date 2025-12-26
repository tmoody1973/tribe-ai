// Curated country data for TRIBE - focused on top migration destinations
// Data sources: World Bank, OECD, Numbeo averages, official government sites

export interface CountryMetrics {
  costOfLivingIndex: number; // NYC = 100
  rentIndex: number; // NYC = 100
  safetyIndex: number; // 0-100
  healthcareIndex: number; // 0-100
  qualityOfLifeIndex: number; // 0-100
  englishProficiency: "native" | "high" | "moderate" | "low";
  internetSpeedMbps: number;
  averageSalaryUSD: number;
  minimumWageUSD: number;
}

export interface CityInfo {
  name: string;
  population: string;
  description: string;
  highlights: string[];
}

export interface VisaOption {
  name: string;
  type: "work" | "student" | "family" | "investor" | "digital_nomad";
  processingTime: string;
  duration: string;
  requirements: string[];
}

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  capital: string;
  population: string;
  currency: string;
  currencyCode: string;
  language: string;
  otherLanguages?: string[];
  timezone: string;
  callingCode: string;
  metrics: CountryMetrics;
  cities: CityInfo[];
  advantages: string[];
  challenges: string[];
  visaOptions: VisaOption[];
  workCulture: string;
  livingTips: string[];
}

// Top migration destinations with curated data
export const countryData: Record<string, CountryData> = {
  DE: {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    capital: "Berlin",
    population: "84.5 million",
    currency: "Euro",
    currencyCode: "EUR",
    language: "German",
    otherLanguages: ["English (widely spoken in business)"],
    timezone: "CET (UTC+1)",
    callingCode: "+49",
    metrics: {
      costOfLivingIndex: 65,
      rentIndex: 45,
      safetyIndex: 80,
      healthcareIndex: 89,
      qualityOfLifeIndex: 82,
      englishProficiency: "high",
      internetSpeedMbps: 92,
      averageSalaryUSD: 62000,
      minimumWageUSD: 24000,
    },
    cities: [
      {
        name: "Berlin",
        population: "3.8M",
        description: "Vibrant startup hub with affordable rents and multicultural atmosphere",
        highlights: ["Tech scene", "Nightlife", "Affordable", "International"],
      },
      {
        name: "Munich",
        population: "1.5M",
        description: "High quality of life, strong job market in tech and automotive",
        highlights: ["High salaries", "Beautiful scenery", "Traditional culture"],
      },
      {
        name: "Frankfurt",
        population: "750K",
        description: "Financial hub with excellent international connections",
        highlights: ["Banking sector", "Airport hub", "Diverse"],
      },
    ],
    advantages: [
      "Strong economy with excellent job prospects",
      "Free university education (even for internationals)",
      "Universal healthcare system",
      "Central location for European travel",
      "Strong worker protections and benefits",
      "High quality of life and safety",
    ],
    challenges: [
      "German language essential for integration",
      "Bureaucracy can be slow and paper-based",
      "Housing shortage in major cities",
      "Cold, grey winters",
      "Direct communication style can feel harsh",
      "Shops closed on Sundays",
    ],
    visaOptions: [
      {
        name: "EU Blue Card",
        type: "work",
        processingTime: "4-12 weeks",
        duration: "Up to 4 years",
        requirements: [
          "University degree or 5+ years experience",
          "Job offer with minimum salary €45,300",
          "Valid passport",
          "Health insurance",
        ],
      },
      {
        name: "Job Seeker Visa",
        type: "work",
        processingTime: "4-8 weeks",
        duration: "6 months",
        requirements: [
          "University degree",
          "Sufficient funds (€947/month)",
          "Valid passport",
          "Health insurance",
        ],
      },
      {
        name: "Student Visa",
        type: "student",
        processingTime: "6-12 weeks",
        duration: "2 years (renewable)",
        requirements: [
          "University admission letter",
          "Proof of funds (€11,208/year)",
          "Health insurance",
          "Valid passport",
        ],
      },
    ],
    workCulture:
      "German workplaces value punctuality, efficiency, and direct communication. Work-life balance is respected with generous vacation (30+ days). Hierarchy exists but opinions are valued. Meetings start on time and have clear agendas.",
    livingTips: [
      "Register your address (Anmeldung) within 2 weeks of arrival",
      "Learn basic German - it significantly improves daily life",
      "Get liability insurance (Haftpflichtversicherung) - it's expected",
      "Open a German bank account for rent and utilities",
      "Recycle properly - Germans take it seriously",
    ],
  },

  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    capital: "Washington, D.C.",
    population: "335 million",
    currency: "US Dollar",
    currencyCode: "USD",
    language: "English",
    otherLanguages: ["Spanish (widely spoken)"],
    timezone: "Multiple (UTC-5 to UTC-10)",
    callingCode: "+1",
    metrics: {
      costOfLivingIndex: 100, // Reference point
      rentIndex: 100,
      safetyIndex: 55,
      healthcareIndex: 69,
      qualityOfLifeIndex: 71,
      englishProficiency: "native",
      internetSpeedMbps: 203,
      averageSalaryUSD: 77000,
      minimumWageUSD: 15000,
    },
    cities: [
      {
        name: "New York City",
        population: "8.3M",
        description: "Global financial and cultural capital with endless opportunities",
        highlights: ["Finance", "Media", "Arts", "Diverse"],
      },
      {
        name: "San Francisco",
        population: "870K",
        description: "Tech capital with high salaries but expensive living costs",
        highlights: ["Tech hub", "Innovation", "Mild weather"],
      },
      {
        name: "Austin",
        population: "1M",
        description: "Growing tech hub with no state income tax and vibrant culture",
        highlights: ["No state tax", "Music scene", "Growing tech"],
      },
    ],
    advantages: [
      "Highest salaries in tech and finance globally",
      "World-leading universities and research",
      "Diverse, multicultural society",
      "Entrepreneurship-friendly environment",
      "Strong job market in many sectors",
      "Cultural influence and entertainment industry",
    ],
    challenges: [
      "Healthcare is expensive without insurance",
      "Work visa process is complex and limited",
      "Gun violence and safety concerns in some areas",
      "Limited public transportation in most cities",
      "Work culture can be demanding with less vacation",
      "High cost of living in major metros",
    ],
    visaOptions: [
      {
        name: "H-1B Work Visa",
        type: "work",
        processingTime: "3-6 months (lottery-based)",
        duration: "3 years (extendable to 6)",
        requirements: [
          "Bachelor's degree or equivalent",
          "Specialty occupation job offer",
          "Employer sponsorship",
          "Selected in annual lottery",
        ],
      },
      {
        name: "F-1 Student Visa",
        type: "student",
        processingTime: "3-5 weeks",
        duration: "Duration of study",
        requirements: [
          "Acceptance to SEVP-certified school",
          "Proof of financial support",
          "Valid passport",
          "Non-immigrant intent",
        ],
      },
      {
        name: "O-1 Extraordinary Ability",
        type: "work",
        processingTime: "2-3 months",
        duration: "3 years (renewable)",
        requirements: [
          "Extraordinary ability in field",
          "Documented achievements",
          "Employer or agent sponsor",
          "Advisory opinion letter",
        ],
      },
    ],
    workCulture:
      "American workplaces tend to be informal and results-oriented. Networking is important for career advancement. Work hours can be long, especially in competitive industries. Direct communication is valued, and initiative is rewarded.",
    livingTips: [
      "Get health insurance immediately - medical bills can be devastating",
      "Build credit history by getting a secured credit card",
      "Social Security Number (SSN) is essential for everything",
      "Learn to drive - most cities require a car",
      "Tip 15-20% at restaurants - it's expected",
    ],
  },

  CA: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    capital: "Ottawa",
    population: "40 million",
    currency: "Canadian Dollar",
    currencyCode: "CAD",
    language: "English, French",
    timezone: "Multiple (UTC-3.5 to UTC-8)",
    callingCode: "+1",
    metrics: {
      costOfLivingIndex: 67,
      rentIndex: 55,
      safetyIndex: 82,
      healthcareIndex: 72,
      qualityOfLifeIndex: 81,
      englishProficiency: "native",
      internetSpeedMbps: 185,
      averageSalaryUSD: 55000,
      minimumWageUSD: 24000,
    },
    cities: [
      {
        name: "Toronto",
        population: "2.9M",
        description: "Canada's largest city and financial hub with diverse communities",
        highlights: ["Finance", "Tech", "Multicultural", "Arts"],
      },
      {
        name: "Vancouver",
        population: "675K",
        description: "Pacific gateway with stunning nature and Asian connections",
        highlights: ["Nature", "Film industry", "Mild climate"],
      },
      {
        name: "Montreal",
        population: "1.8M",
        description: "French-speaking cultural hub with European flair",
        highlights: ["Affordable", "Culture", "Food scene", "Bilingual"],
      },
    ],
    advantages: [
      "Clear immigration pathways (Express Entry)",
      "Universal healthcare coverage",
      "Welcoming multicultural society",
      "High quality of life and safety",
      "Strong worker protections",
      "Path to citizenship (3 years as PR)",
    ],
    challenges: [
      "Cold winters, especially in most provinces",
      "Credential recognition can take time",
      "Housing expensive in major cities",
      "Lower salaries than US for same roles",
      "French required in Quebec",
      "Healthcare wait times for specialists",
    ],
    visaOptions: [
      {
        name: "Express Entry (Federal Skilled Worker)",
        type: "work",
        processingTime: "6-12 months",
        duration: "Permanent Residence",
        requirements: [
          "CRS score above cutoff (450-500+)",
          "Language test (IELTS/TEF)",
          "Education assessment (ECA)",
          "Work experience (1+ years)",
        ],
      },
      {
        name: "Provincial Nominee Program",
        type: "work",
        processingTime: "8-18 months",
        duration: "Permanent Residence",
        requirements: [
          "Meet provincial criteria",
          "Intent to live in province",
          "Job offer may be required",
          "Language proficiency",
        ],
      },
      {
        name: "Study Permit",
        type: "student",
        processingTime: "4-16 weeks",
        duration: "Duration of study + 90 days",
        requirements: [
          "Acceptance to DLI",
          "Proof of funds (CAD $15,000/year + tuition)",
          "Clean criminal record",
          "Good health",
        ],
      },
    ],
    workCulture:
      "Canadian workplaces are collaborative and polite. Direct but diplomatic communication is preferred. Work-life balance is valued with typically 2-3 weeks vacation. Diversity and inclusion are emphasized. Hierarchy is flatter than many countries.",
    livingTips: [
      "Apply for SIN (Social Insurance Number) immediately",
      "Get a health card for your province",
      "Winter gear is essential - invest in good boots and coat",
      "Open a bank account to build credit history",
      "Get a driver's license if moving outside major cities",
    ],
  },

  AU: {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    capital: "Canberra",
    population: "27 million",
    currency: "Australian Dollar",
    currencyCode: "AUD",
    language: "English",
    timezone: "Multiple (UTC+8 to UTC+11)",
    callingCode: "+61",
    metrics: {
      costOfLivingIndex: 73,
      rentIndex: 60,
      safetyIndex: 78,
      healthcareIndex: 80,
      qualityOfLifeIndex: 83,
      englishProficiency: "native",
      internetSpeedMbps: 92,
      averageSalaryUSD: 64000,
      minimumWageUSD: 31000,
    },
    cities: [
      {
        name: "Sydney",
        population: "5.4M",
        description: "Australia's largest city with iconic harbor and beaches",
        highlights: ["Finance", "Beaches", "Diverse", "Iconic"],
      },
      {
        name: "Melbourne",
        population: "5.1M",
        description: "Cultural capital known for arts, coffee, and livability",
        highlights: ["Culture", "Coffee", "Arts", "Sports"],
      },
      {
        name: "Brisbane",
        population: "2.6M",
        description: "Sunny Queensland capital with growing tech scene",
        highlights: ["Sunshine", "Affordable", "Outdoor lifestyle"],
      },
    ],
    advantages: [
      "High minimum wage ($24.10 AUD/hour)",
      "Great weather and outdoor lifestyle",
      "Strong economy with low unemployment",
      "Universal Medicare healthcare",
      "Points-based visa system is transparent",
      "Diverse, multicultural society (30% foreign-born)",
    ],
    challenges: [
      "Far from other continents (expensive flights home)",
      "Dangerous wildlife (learn the rules)",
      "High cost of living in major cities",
      "Visa processing can be slow",
      "Intense sun requires protection",
      "Regional areas have limited services",
    ],
    visaOptions: [
      {
        name: "Skilled Independent (189)",
        type: "work",
        processingTime: "6-12 months",
        duration: "Permanent",
        requirements: [
          "Occupation on skilled list",
          "65+ points",
          "Skills assessment",
          "IELTS 6.0+",
          "Under 45 years old",
        ],
      },
      {
        name: "Employer Sponsored (482)",
        type: "work",
        processingTime: "1-4 months",
        duration: "2-4 years",
        requirements: [
          "Job offer from approved sponsor",
          "Occupation on eligible list",
          "Relevant qualifications",
          "English language ability",
        ],
      },
      {
        name: "Working Holiday (417/462)",
        type: "work",
        processingTime: "2-4 weeks",
        duration: "1 year (extendable)",
        requirements: [
          "18-30 years (35 for some countries)",
          "Eligible passport",
          "No dependent children",
          "Sufficient funds (AUD $5,000)",
        ],
      },
    ],
    workCulture:
      "Australian workplaces are egalitarian and informal. 'Tall poppy syndrome' discourages excessive self-promotion. Work-life balance is valued - leaving at 5 PM is normal. Casual Fridays are common. Directness is appreciated but keep it friendly.",
    livingTips: [
      "Get a Tax File Number (TFN) within 28 days",
      "Superannuation (retirement) is mandatory - 11.5% of salary",
      "Apply for Medicare card for free healthcare",
      "Sun protection is essential - slip, slop, slap",
      "Learn about local wildlife dangers but don't panic",
    ],
  },

  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    capital: "London",
    population: "67 million",
    currency: "British Pound",
    currencyCode: "GBP",
    language: "English",
    timezone: "GMT (UTC+0)",
    callingCode: "+44",
    metrics: {
      costOfLivingIndex: 75,
      rentIndex: 65,
      safetyIndex: 75,
      healthcareIndex: 74,
      qualityOfLifeIndex: 77,
      englishProficiency: "native",
      internetSpeedMbps: 85,
      averageSalaryUSD: 52000,
      minimumWageUSD: 25000,
    },
    cities: [
      {
        name: "London",
        population: "9M",
        description: "Global financial center with unmatched cultural offerings",
        highlights: ["Finance", "Culture", "Diverse", "History"],
      },
      {
        name: "Manchester",
        population: "550K",
        description: "Northern powerhouse with growing tech scene and lower costs",
        highlights: ["Tech hub", "Football", "Music", "Affordable"],
      },
      {
        name: "Edinburgh",
        population: "540K",
        description: "Scotland's capital with stunning architecture and festivals",
        highlights: ["History", "Festivals", "Nature", "Universities"],
      },
    ],
    advantages: [
      "English-speaking with no language barrier",
      "Free NHS healthcare",
      "Gateway to Europe (though post-Brexit)",
      "World-class universities",
      "Rich history and cultural institutions",
      "Strong legal and financial sectors",
    ],
    challenges: [
      "High living costs, especially London",
      "Grey, rainy weather",
      "Post-Brexit visa complexity",
      "Small living spaces for the price",
      "NHS wait times can be long",
      "Work-life balance varies by industry",
    ],
    visaOptions: [
      {
        name: "Skilled Worker Visa",
        type: "work",
        processingTime: "3 weeks",
        duration: "Up to 5 years",
        requirements: [
          "Job offer from licensed sponsor",
          "Minimum salary threshold (£26,200+)",
          "English language ability (B1)",
          "Eligible occupation",
        ],
      },
      {
        name: "Global Talent Visa",
        type: "work",
        processingTime: "3-8 weeks",
        duration: "Up to 5 years",
        requirements: [
          "Endorsement from approved body",
          "Exceptional talent or promise",
          "In science, engineering, arts, or tech",
        ],
      },
      {
        name: "Student Visa",
        type: "student",
        processingTime: "3 weeks",
        duration: "Length of course + 2-4 months",
        requirements: [
          "CAS from licensed institution",
          "Proof of funds",
          "English language ability",
          "Valid passport",
        ],
      },
    ],
    workCulture:
      "British workplaces value professionalism with a touch of humor. Communication tends to be indirect - read between the lines. Tea breaks are cultural. Punctuality matters. Post-work drinks ('going to the pub') is common networking.",
    livingTips: [
      "Get a National Insurance Number for work",
      "Register with a GP (doctor) for NHS access",
      "Oyster card or contactless for London transport",
      "Carry an umbrella - weather changes quickly",
      "Council tax is significant - budget for it",
    ],
  },

  NL: {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    capital: "Amsterdam",
    population: "17.5 million",
    currency: "Euro",
    currencyCode: "EUR",
    language: "Dutch",
    otherLanguages: ["English (95% speak it)"],
    timezone: "CET (UTC+1)",
    callingCode: "+31",
    metrics: {
      costOfLivingIndex: 73,
      rentIndex: 60,
      safetyIndex: 85,
      healthcareIndex: 87,
      qualityOfLifeIndex: 85,
      englishProficiency: "high",
      internetSpeedMbps: 139,
      averageSalaryUSD: 58000,
      minimumWageUSD: 28000,
    },
    cities: [
      {
        name: "Amsterdam",
        population: "870K",
        description: "Cosmopolitan capital known for canals, bikes, and tech startups",
        highlights: ["Tech hub", "Expat-friendly", "Bike culture", "Tolerant"],
      },
      {
        name: "Rotterdam",
        population: "650K",
        description: "Modern port city with innovative architecture",
        highlights: ["Architecture", "Port", "Diverse", "Up-and-coming"],
      },
      {
        name: "The Hague",
        population: "550K",
        description: "Political capital with international organizations",
        highlights: ["International law", "Beach access", "Expat community"],
      },
    ],
    advantages: [
      "Almost everyone speaks excellent English",
      "30% ruling tax benefit for skilled migrants",
      "Excellent work-life balance",
      "Bike-friendly infrastructure",
      "Very high quality of life",
      "Progressive, tolerant society",
    ],
    challenges: [
      "Extreme housing shortage",
      "High income tax (up to 49.5%)",
      "Grey, rainy weather",
      "Flat landscape may feel monotonous",
      "Making Dutch friends takes effort",
      "Small country limits career moves",
    ],
    visaOptions: [
      {
        name: "Highly Skilled Migrant",
        type: "work",
        processingTime: "2-4 weeks",
        duration: "5 years max",
        requirements: [
          "Job with recognized sponsor",
          "Salary threshold (€5,008/month for 30+)",
          "Valid passport",
        ],
      },
      {
        name: "Orientation Year (Zoekjaar)",
        type: "work",
        processingTime: "4-6 weeks",
        duration: "1 year",
        requirements: [
          "Recent graduate (within 3 years)",
          "From ranked university (top 200)",
          "Sufficient funds",
        ],
      },
    ],
    workCulture:
      "Dutch workplaces are egalitarian and direct. Meetings are for decisions, not status. Work-life balance is sacred - leaving at 5 PM is normal. Part-time work is common and respected. 'Poldering' (consensus-building) is valued.",
    livingTips: [
      "Get a BSN (citizen service number) first - required for everything",
      "Register for housing immediately - waitlists are years long",
      "Get a bike - it's the main transport",
      "Learn to be direct - Dutch appreciate honesty",
      "Health insurance is mandatory within 4 months",
    ],
  },

  SG: {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    capital: "Singapore",
    population: "5.9 million",
    currency: "Singapore Dollar",
    currencyCode: "SGD",
    language: "English, Mandarin, Malay, Tamil",
    timezone: "SGT (UTC+8)",
    callingCode: "+65",
    metrics: {
      costOfLivingIndex: 81,
      rentIndex: 90,
      safetyIndex: 95,
      healthcareIndex: 86,
      qualityOfLifeIndex: 80,
      englishProficiency: "native",
      internetSpeedMbps: 255,
      averageSalaryUSD: 65000,
      minimumWageUSD: 0, // No minimum wage
    },
    cities: [
      {
        name: "Singapore",
        population: "5.9M",
        description: "City-state that's a global business hub with world-class infrastructure",
        highlights: ["Business hub", "Safe", "Efficient", "Multicultural"],
      },
    ],
    advantages: [
      "Extremely safe and clean",
      "Low taxes (max 22% income tax)",
      "World-class infrastructure",
      "English is official language",
      "Strategic location for Asia business",
      "Efficient government services",
    ],
    challenges: [
      "Very high cost of living, especially rent and cars",
      "Hot and humid year-round",
      "Limited personal freedoms (strict laws)",
      "Small country with no escape",
      "Competitive 'kiasu' culture",
      "Work hours can be very long",
    ],
    visaOptions: [
      {
        name: "Employment Pass",
        type: "work",
        processingTime: "3-8 weeks",
        duration: "1-2 years (renewable)",
        requirements: [
          "Job offer with SGD $5,000+/month salary",
          "Recognized qualifications",
          "Relevant work experience",
        ],
      },
      {
        name: "S Pass",
        type: "work",
        processingTime: "3-4 weeks",
        duration: "2 years",
        requirements: [
          "Job offer with SGD $3,150+/month",
          "Diploma or degree",
          "Company quota available",
        ],
      },
      {
        name: "Tech.Pass",
        type: "work",
        processingTime: "8 weeks",
        duration: "2 years",
        requirements: [
          "Tech expertise",
          "SGD $20,000+/month salary OR",
          "5+ years experience in tech leadership",
        ],
      },
    ],
    workCulture:
      "Singapore workplaces can be hierarchical with long hours expected. Face-saving is important - avoid embarrassing others publicly. Punctuality and professionalism are valued. Networking over meals (hawker centers!) is common.",
    livingTips: [
      "Open a bank account with DBS, OCBC, or UOB",
      "Get a SingPass for government services",
      "EZ-Link card for public transport",
      "Chewing gum is banned - don't bring it",
      "Hawker centers offer affordable meals ($3-5 SGD)",
    ],
  },

  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    capital: "Abu Dhabi",
    population: "10 million",
    currency: "UAE Dirham",
    currencyCode: "AED",
    language: "Arabic",
    otherLanguages: ["English (widely spoken)"],
    timezone: "GST (UTC+4)",
    callingCode: "+971",
    metrics: {
      costOfLivingIndex: 61,
      rentIndex: 55,
      safetyIndex: 92,
      healthcareIndex: 72,
      qualityOfLifeIndex: 74,
      englishProficiency: "high",
      internetSpeedMbps: 238,
      averageSalaryUSD: 55000,
      minimumWageUSD: 0, // No minimum wage
    },
    cities: [
      {
        name: "Dubai",
        population: "3.5M",
        description: "Futuristic business hub known for luxury and tax-free income",
        highlights: ["Tax-free", "Luxury", "Business hub", "Beaches"],
      },
      {
        name: "Abu Dhabi",
        population: "1.5M",
        description: "Capital city with government jobs and cultural institutions",
        highlights: ["Capital", "Oil wealth", "Culture", "Family-friendly"],
      },
    ],
    advantages: [
      "Zero income tax",
      "High salaries with benefits packages",
      "Very safe and modern",
      "Year-round sunshine",
      "Strategic location between East and West",
      "World-class infrastructure",
    ],
    challenges: [
      "Extremely hot summers (40°C+)",
      "Visa tied to employment (lose job = leave)",
      "Conservative social norms",
      "No path to citizenship",
      "Expensive private schooling",
      "Long working hours are common",
    ],
    visaOptions: [
      {
        name: "Employment Visa",
        type: "work",
        processingTime: "2-3 weeks",
        duration: "2-3 years",
        requirements: [
          "Job offer from UAE company",
          "Entry permit",
          "Medical exam",
          "Emirates ID",
        ],
      },
      {
        name: "Golden Visa",
        type: "investor",
        processingTime: "2-4 weeks",
        duration: "10 years",
        requirements: [
          "AED 2M property investment OR",
          "AED 10M public investment OR",
          "Specialized talent/researcher",
        ],
      },
      {
        name: "Freelance/Remote Work Visa",
        type: "digital_nomad",
        processingTime: "2-3 weeks",
        duration: "1 year",
        requirements: [
          "Proof of freelance income",
          "Valid passport",
          "Health insurance",
          "Proof of funds",
        ],
      },
    ],
    workCulture:
      "UAE workplaces mix Western business practices with Arab hospitality. Relationships matter - invest time in building them. Dress is conservative. Thursday-Friday was the weekend but now Friday-Saturday. Ramadan affects work hours.",
    livingTips: [
      "Get Emirates ID immediately after visa",
      "Open a bank account for salary (required)",
      "Get a local SIM - du or Etisalat",
      "Respect local customs, especially dress and PDA",
      "Alcohol only in licensed venues with permit",
    ],
  },
};

// Get country data by code
export function getCountryData(code: string): CountryData | undefined {
  return countryData[code.toUpperCase()];
}

// Calculate comparison between origin and destination
export function compareCountries(
  originCode: string,
  destCode: string
): {
  costOfLiving: { difference: number; isHigher: boolean };
  rent: { difference: number; isHigher: boolean };
  safety: { difference: number; isHigher: boolean };
  healthcare: { difference: number; isHigher: boolean };
  qualityOfLife: { difference: number; isHigher: boolean };
} | null {
  const origin = getCountryData(originCode);
  const dest = getCountryData(destCode);

  if (!origin || !dest) return null;

  const calcDiff = (destVal: number, originVal: number) => ({
    difference: Math.round(((destVal - originVal) / originVal) * 100),
    isHigher: destVal > originVal,
  });

  return {
    costOfLiving: calcDiff(dest.metrics.costOfLivingIndex, origin.metrics.costOfLivingIndex),
    rent: calcDiff(dest.metrics.rentIndex, origin.metrics.rentIndex),
    safety: calcDiff(dest.metrics.safetyIndex, origin.metrics.safetyIndex),
    healthcare: calcDiff(dest.metrics.healthcareIndex, origin.metrics.healthcareIndex),
    qualityOfLife: calcDiff(dest.metrics.qualityOfLifeIndex, origin.metrics.qualityOfLifeIndex),
  };
}
