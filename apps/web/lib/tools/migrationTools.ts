// Migration toolkit - generates deep links to useful platforms

export interface HousingSearchParams {
  city: string;
  country: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  stayType: "short" | "monthly" | "long_term";
  preferences?: string[];
}

export interface HousingPlatform {
  name: string;
  url: string;
  type: string;
  bestFor: string;
}

export interface HousingSearchResult {
  location: { city: string; country: string };
  platforms: HousingPlatform[];
  tips: string[];
}

export function searchTemporaryHousing(params: HousingSearchParams): HousingSearchResult {
  const { city, country, checkIn, checkOut, guests, stayType, preferences } = params;

  // Airbnb URL
  const airbnbParams = new URLSearchParams();
  if (checkIn) airbnbParams.set("checkin", checkIn);
  if (checkOut) airbnbParams.set("checkout", checkOut);
  airbnbParams.set("adults", guests.toString());
  if (stayType === "monthly" || stayType === "long_term") {
    airbnbParams.set("min_nights", "28");
    airbnbParams.set("l2_property_type_ids[]", "1"); // Entire place
  }

  // Booking.com URL
  const bookingParams = new URLSearchParams();
  bookingParams.set("ss", `${city}, ${country}`);
  if (checkIn) bookingParams.set("checkin", checkIn);
  if (checkOut) bookingParams.set("checkout", checkOut);
  bookingParams.set("group_adults", guests.toString());
  bookingParams.set("nflt", "roomfacility=11"); // Has kitchen

  const platforms: HousingPlatform[] = [
    {
      name: "Airbnb",
      url: `https://www.airbnb.com/s/${encodeURIComponent(city)}--${encodeURIComponent(country)}/homes?${airbnbParams}`,
      type: "vacation_rental",
      bestFor: "Unique stays, entire apartments, local experience",
    },
    {
      name: "Booking.com",
      url: `https://www.booking.com/searchresults.html?${bookingParams}`,
      type: "mixed",
      bestFor: "Flexible cancellation, mix of hotels and apartments",
    },
    {
      name: "Vrbo",
      url: `https://www.vrbo.com/search?destination=${encodeURIComponent(`${city}, ${country}`)}&adults=${guests}`,
      type: "vacation_rental",
      bestFor: "Larger properties, families",
    },
  ];

  // Add long-term platforms for monthly/long stays
  if (stayType === "monthly" || stayType === "long_term") {
    platforms.push(
      {
        name: "HousingAnywhere",
        url: `https://housinganywhere.com/s/${encodeURIComponent(city)}--${encodeURIComponent(country)}`,
        type: "mid_term_rental",
        bestFor: "Expat-friendly, 1-12 month verified rentals",
      },
      {
        name: "Spotahome",
        url: `https://www.spotahome.com/s/${city.toLowerCase().replace(/\s+/g, "-")}`,
        type: "mid_term_rental",
        bestFor: "Verified apartments, no in-person viewings needed",
      },
      {
        name: "Furnished Finder",
        url: `https://www.furnishedfinder.com/housing/${city.toLowerCase().replace(/\s+/g, "-")}`,
        type: "furnished_rental",
        bestFor: "Traveling professionals, fully furnished",
      }
    );
  }

  const tips = generateRelocationTips(country, stayType, preferences);

  return {
    location: { city, country },
    platforms,
    tips,
  };
}

function generateRelocationTips(
  country: string,
  stayType: string,
  preferences?: string[]
): string[] {
  const tips = [
    `Verify visa requirements for ${country} before booking extended stays`,
    "Book refundable options for your first week while you explore neighborhoods",
    "Prioritize places with strong WiFi reviews if working remotely",
    "Look for locations near public transit to ease your transition",
  ];

  if (stayType === "long_term" || stayType === "monthly") {
    tips.push(
      "Consider negotiating monthly rates directly with hosts for stays over 3 months",
      "Check local rental laws - some countries have tenant protections even for short-term stays"
    );
  }

  if (preferences?.includes("pet-friendly")) {
    tips.push("Filter for pet-friendly listings and check pet deposits/fees");
  }

  if (preferences?.includes("workspace")) {
    tips.push("Look for dedicated workspace areas and check WiFi speed reviews");
  }

  return tips;
}

// Cost of Living Comparison
export interface CostComparisonResult {
  comparison: {
    numbeoUrl: string;
    expatistanUrl: string;
  };
  note: string;
}

export function compareCostOfLiving(
  originCity: string,
  originCountry: string,
  destinationCity: string,
  destinationCountry: string
): CostComparisonResult {
  return {
    comparison: {
      numbeoUrl: `https://www.numbeo.com/cost-of-living/compare_cities.jsp?country1=${encodeURIComponent(originCountry)}&city1=${encodeURIComponent(originCity)}&country2=${encodeURIComponent(destinationCountry)}&city2=${encodeURIComponent(destinationCity)}`,
      expatistanUrl: `https://www.expatistan.com/cost-of-living/comparison/${originCity.toLowerCase().replace(/\s+/g, "-")}/${destinationCity.toLowerCase().replace(/\s+/g, "-")}`,
    },
    note: "These comparisons show relative costs. Actual expenses vary based on lifestyle.",
  };
}

// Expat Community Finder
export interface ExpatCommunityResult {
  communities: {
    platform: string;
    url: string;
    type: string;
  }[];
}

export function findExpatCommunities(city: string, country: string): ExpatCommunityResult {
  const location = encodeURIComponent(`${city} ${country}`);

  return {
    communities: [
      {
        platform: "InterNations",
        url: `https://www.internations.org/${city.toLowerCase().replace(/\s+/g, "-")}-expats`,
        type: "Expat networking and events",
      },
      {
        platform: "Facebook Groups",
        url: `https://www.facebook.com/search/groups/?q=expats%20${location}`,
        type: "Community groups and local advice",
      },
      {
        platform: "Meetup",
        url: `https://www.meetup.com/find/?location=${location}&source=GROUPS&keywords=expat`,
        type: "In-person events and activities",
      },
      {
        platform: "Reddit",
        url: `https://www.reddit.com/search/?q=${location}%20expat&type=sr`,
        type: "Discussion forums and Q&A",
      },
      {
        platform: "Expat.com Forum",
        url: `https://www.expat.com/forum/${country.toLowerCase().replace(/\s+/g, "-")}/`,
        type: "Expat advice and experiences",
      },
    ],
  };
}

// Visa Requirements Lookup
export interface VisaResourcesResult {
  resources: {
    name: string;
    url: string;
    description: string;
  }[];
  disclaimer: string;
}

export function checkVisaResources(
  passportCountry: string,
  destinationCountry: string,
  purposeOfStay: "tourism" | "work" | "study" | "digital_nomad" | "retirement"
): VisaResourcesResult {
  const resources = [
    {
      name: "VisaGuide.World",
      url: `https://visaguide.world/${destinationCountry.toLowerCase().replace(/\s+/g, "-")}-visa/`,
      description: "Comprehensive visa requirements by nationality",
    },
    {
      name: "iVisa",
      url: `https://www.ivisa.com/visa/${destinationCountry.toLowerCase().replace(/\s+/g, "-")}`,
      description: "Visa eligibility checker and application service",
    },
    {
      name: "Official Embassy",
      url: `https://www.google.com/search?q=${encodeURIComponent(`${destinationCountry} embassy ${passportCountry} visa requirements`)}`,
      description: "Search for official embassy information",
    },
  ];

  // Add nomad-specific resources
  if (purposeOfStay === "digital_nomad") {
    resources.push({
      name: "Nomad List",
      url: `https://nomadlist.com/${destinationCountry.toLowerCase().replace(/\s+/g, "-")}`,
      description: "Digital nomad community info, visa options, and cost of living",
    });
  }

  return {
    resources,
    disclaimer:
      "Visa requirements change frequently. Always verify with official government sources before making travel plans.",
  };
}

// Healthcare Info
export interface HealthcareInfoResult {
  resources: {
    name: string;
    url: string;
    description: string;
  }[];
  considerations: string[];
}

export function getHealthcareInfo(
  destinationCountry: string,
  stayDuration: "short_term" | "long_term" | "permanent"
): HealthcareInfoResult {
  const resources = [
    {
      name: "SafetyWing",
      url: "https://safetywing.com/nomad-insurance/",
      description: "Popular travel medical insurance for nomads and expats",
    },
    {
      name: "World Nomads",
      url: "https://www.worldnomads.com/",
      description: "Travel insurance with medical coverage",
    },
    {
      name: "Cigna Global",
      url: "https://www.cignaglobal.com/",
      description: "International health insurance for expats",
    },
  ];

  const considerations = [
    "Research if your destination has public healthcare available to residents",
    "Check if your current prescriptions are available and legal in the destination country",
    "Consider insurance that includes medical evacuation coverage",
  ];

  if (stayDuration === "permanent" || stayDuration === "long_term") {
    considerations.push(
      "Look into local health insurance options once you establish residency",
      "Research the process for registering with local healthcare systems"
    );
  }

  return { resources, considerations };
}

// Cultural Decoder - Help understand cultural differences
export interface CulturalProfile {
  originCulture: string;
  communicationStyle: "direct" | "indirect" | "context-dependent";
  familyStructure: "nuclear" | "extended" | "multi-generational";
  timeOrientation: "monochronic" | "polychronic";
  values: string[];
  foodDietary: string[];
  celebrations: string[];
}

export interface CulturalDecoderResult {
  situation: string;
  originPerspective: {
    interpretation: string;
    culturalContext: string;
  };
  destinationPerspective: {
    interpretation: string;
    culturalContext: string;
  };
  bridgingAdvice: string[];
  recoveryPhrases: string[];
}

// Cultural dimension data for common countries
const culturalDimensions: Record<string, {
  communicationStyle: string;
  timeOrientation: string;
  socialNorms: string;
  workCulture: string;
}> = {
  germany: {
    communicationStyle: "Direct and explicit. Germans value clarity and honesty over politeness. Saying 'no' is perfectly acceptable.",
    timeOrientation: "Highly monochronic. Punctuality is extremely important - being even 5 minutes late is considered rude.",
    socialNorms: "Personal space is valued. Small talk is minimal. Friendships develop slowly but are deep.",
    workCulture: "Separation of work and personal life. Efficiency is prized. Titles and formality matter initially.",
  },
  usa: {
    communicationStyle: "Generally direct but wrapped in positivity. 'How are you?' is a greeting, not a question.",
    timeOrientation: "Monochronic but varies by region. Business culture values punctuality.",
    socialNorms: "Friendly and informal quickly. Smiling and small talk are common.",
    workCulture: "Work-life boundaries can blur. Networking is important. Performance-oriented.",
  },
  japan: {
    communicationStyle: "High-context and indirect. Much is left unsaid. Reading the air (kuuki wo yomu) is essential.",
    timeOrientation: "Extremely monochronic. Being early is preferred to being on time.",
    socialNorms: "Hierarchy is important. Saving face (mentsu) guides interactions. Group harmony over individual expression.",
    workCulture: "Long hours common. Seniority matters. Building relationships (nemawashi) before decisions.",
  },
  nigeria: {
    communicationStyle: "Warm and expressive. Respect for elders shown through greetings and titles.",
    timeOrientation: "Polychronic and flexible. Relationships take precedence over schedules.",
    socialNorms: "Extended family is central. Community-oriented. Hospitality is paramount.",
    workCulture: "Relationships and trust precede business. Titles are important.",
  },
  india: {
    communicationStyle: "Indirect, especially with superiors. Context and non-verbal cues matter.",
    timeOrientation: "Generally polychronic. Flexibility with time, especially for social events.",
    socialNorms: "Respect for elders and hierarchy. Hospitality is a duty. Family-oriented.",
    workCulture: "Hierarchical. Building personal relationships important for business.",
  },
  brazil: {
    communicationStyle: "Warm, expressive, and relationship-focused. Physical touch during conversation is normal.",
    timeOrientation: "Polychronic. 'Brazilian time' is flexible. Relationships matter more than schedules.",
    socialNorms: "Very social and family-oriented. Personal questions are signs of interest, not intrusion.",
    workCulture: "Relationship-driven. Personal connections matter for business.",
  },
  uk: {
    communicationStyle: "Indirect and understated. Heavy use of irony and sarcasm. 'Not bad' means 'good'.",
    timeOrientation: "Monochronic. Punctuality expected in professional settings.",
    socialNorms: "Queuing is sacred. Reserve in public. Dry humor is common.",
    workCulture: "Professional boundaries respected. Email culture. Work-life balance valued.",
  },
  canada: {
    communicationStyle: "Polite and diplomatic. Conflict avoidance. Saying 'sorry' is reflexive.",
    timeOrientation: "Monochronic. Punctuality is expected.",
    socialNorms: "Multicultural and inclusive. Politeness and fairness valued.",
    workCulture: "Collaborative. Diversity is celebrated. Work-life balance prioritized.",
  },
  france: {
    communicationStyle: "Direct but formal. Debate and disagreement are intellectual exercises, not personal attacks.",
    timeOrientation: "Somewhat flexible. Lunch breaks are sacred.",
    socialNorms: "Privacy valued. Relationships build slowly. Greetings (la bise) have rules.",
    workCulture: "Formal hierarchy. Long lunches. Strong labor protections.",
  },
  korea: {
    communicationStyle: "Indirect with emphasis on hierarchy. Age and status determine speech levels.",
    timeOrientation: "Fast-paced (ppalli ppalli culture). Efficiency valued.",
    socialNorms: "Confucian influence. Respect for age/hierarchy. Group drinking culture in work.",
    workCulture: "Long hours. Company loyalty. Hierarchical. After-work socializing expected.",
  },
};

export function decodeCulturalSituation(
  situation: string,
  originCountry: string,
  destinationCountry: string
  // userProfile can be added later for personalization
): CulturalDecoderResult {
  const destLower = destinationCountry.toLowerCase().replace(/\s+/g, "");
  const originLower = originCountry.toLowerCase().replace(/\s+/g, "");

  const destCulture = culturalDimensions[destLower] || {
    communicationStyle: "Varies by context",
    timeOrientation: "Check local norms",
    socialNorms: "Research local customs",
    workCulture: "Observe and adapt",
  };

  const originCulture = culturalDimensions[originLower] || {
    communicationStyle: "Based on your cultural background",
    timeOrientation: "Your normal expectations",
    socialNorms: "Your familiar norms",
    workCulture: "Your work experience",
  };

  // Generate contextual advice based on the cultural dimensions
  const bridgingAdvice = [
    `Remember: ${destCulture.communicationStyle}`,
    `Time expectation: ${destCulture.timeOrientation}`,
    "When in doubt, observe others and ask trusted locals for guidance",
    "Cultural misunderstandings happen to everyone - they're learning opportunities",
  ];

  const recoveryPhrases = [
    "I'm still learning the local customs - could you help me understand?",
    "In my culture, we typically... Is it different here?",
    "I apologize if I've made a cultural mistake - I'm eager to learn",
    "Could you explain what's expected in this situation?",
  ];

  return {
    situation,
    originPerspective: {
      interpretation: `From ${originCountry}'s perspective: ${originCulture.socialNorms}`,
      culturalContext: originCulture.communicationStyle,
    },
    destinationPerspective: {
      interpretation: `In ${destinationCountry}: ${destCulture.socialNorms}`,
      culturalContext: destCulture.communicationStyle,
    },
    bridgingAdvice,
    recoveryPhrases,
  };
}

// Get cultural tips for specific situations
export interface CulturalTipsResult {
  category: string;
  tips: {
    tip: string;
    why: string;
    doInstead?: string;
  }[];
  resources: {
    name: string;
    url: string;
  }[];
}

export function getCulturalTips(
  destinationCountry: string,
  category: "workplace" | "social" | "dining" | "daily_life" | "relationships"
): CulturalTipsResult {
  const destLower = destinationCountry.toLowerCase().replace(/\s+/g, "");

  const categoryTips: Record<string, { tip: string; why: string; doInstead?: string }[]> = {
    workplace: [
      {
        tip: "Observe how people address their superiors before adopting a casual tone",
        why: "Hierarchy and formality expectations vary greatly between cultures",
        doInstead: "Start formal and let others indicate when it's okay to be casual",
      },
      {
        tip: "Pay attention to meeting culture - who speaks first, how decisions are made",
        why: "Some cultures value consensus, others defer to seniority",
      },
      {
        tip: "Note the expected response time for emails and messages",
        why: "Urgency and communication frequency expectations differ",
      },
    ],
    social: [
      {
        tip: "Learn the local greeting customs - handshakes, bows, cheek kisses",
        why: "Physical greeting norms can be very different and are often the first impression",
      },
      {
        tip: "Understand gift-giving etiquette if invited to someone's home",
        why: "Some cultures expect gifts, others may find them inappropriate",
      },
      {
        tip: "Be mindful of personal space and touch norms",
        why: "Comfort with physical closeness varies significantly",
      },
    ],
    dining: [
      {
        tip: "Learn basic table manners for the destination culture",
        why: "Eating customs (utensils, noise, sharing) vary widely",
      },
      {
        tip: "Understand tipping expectations",
        why: "Some countries expect tips, others consider it offensive",
      },
      {
        tip: "Know the norms around splitting bills vs. treating others",
        why: "Payment etiquette can cause awkward situations if unexpected",
      },
    ],
    daily_life: [
      {
        tip: "Learn basic phrases in the local language",
        why: "Even simple attempts show respect and open doors",
      },
      {
        tip: "Observe queuing behavior and public conduct norms",
        why: "Public behavior expectations differ and violations are noticed",
      },
      {
        tip: "Understand noise levels expected in residential areas",
        why: "Noise tolerance varies and can affect neighbor relationships",
      },
    ],
    relationships: [
      {
        tip: "Understand how friendships typically develop in this culture",
        why: "Some cultures form friendships quickly, others take years",
      },
      {
        tip: "Learn about dating norms if applicable",
        why: "Relationship expectations and progression can differ significantly",
      },
      {
        tip: "Understand family involvement expectations",
        why: "Role of extended family in decisions varies by culture",
      },
    ],
  };

  return {
    category,
    tips: categoryTips[category] || categoryTips.social,
    resources: [
      {
        name: "Culture Trip",
        url: `https://theculturetrip.com/search?q=${encodeURIComponent(destinationCountry)}%20culture`,
      },
      {
        name: "Commisceo Global",
        url: `https://www.commisceo-global.com/resources/country-guides/${destLower}`,
      },
    ],
  };
}

// Document Checklist for Migration
export interface DocumentChecklistResult {
  country: string;
  checklist: {
    category: string;
    items: {
      document: string;
      description: string;
      urgency: "essential" | "important" | "recommended";
      tips?: string;
    }[];
  }[];
  resources: { name: string; url: string }[];
}

export function getDocumentChecklist(
  destinationCountry: string,
  purpose: "work" | "study" | "family" | "retirement"
): DocumentChecklistResult {
  const baseDocuments = [
    {
      category: "Identity & Travel",
      items: [
        { document: "Valid Passport", description: "Must be valid for at least 6 months beyond your stay", urgency: "essential" as const },
        { document: "Passport Photos", description: "Recent photos meeting destination country specifications", urgency: "essential" as const },
        { document: "Birth Certificate", description: "Certified copy, possibly apostilled", urgency: "important" as const },
        { document: "Marriage Certificate", description: "If applicable, certified and possibly apostilled", urgency: "important" as const },
      ],
    },
    {
      category: "Visa & Immigration",
      items: [
        { document: "Visa Application", description: "Complete all required forms", urgency: "essential" as const },
        { document: "Visa Photos", description: "Specific requirements vary by country", urgency: "essential" as const },
        { document: "Proof of Funds", description: "Bank statements showing sufficient funds", urgency: "essential" as const },
        { document: "Health Insurance", description: "Coverage valid in destination country", urgency: "essential" as const },
      ],
    },
    {
      category: "Background & Records",
      items: [
        { document: "Police Clearance", description: "Criminal background check from your country", urgency: "important" as const },
        { document: "Medical Records", description: "Vaccination records and health history", urgency: "important" as const },
        { document: "Academic Transcripts", description: "Certified copies of degrees and certificates", urgency: "important" as const, tips: "Get apostilled if required" },
      ],
    },
    {
      category: "Financial",
      items: [
        { document: "Bank Statements", description: "Usually 3-6 months of statements", urgency: "essential" as const },
        { document: "Tax Records", description: "Recent tax returns from home country", urgency: "recommended" as const },
        { document: "Employment Verification", description: "Letter from current/previous employer", urgency: "important" as const },
      ],
    },
  ];

  // Add purpose-specific documents
  if (purpose === "work") {
    baseDocuments.push({
      category: "Employment",
      items: [
        { document: "Job Offer Letter", description: "Formal offer from employer in destination country", urgency: "essential" as const },
        { document: "Employment Contract", description: "Signed contract with salary details", urgency: "essential" as const },
        { document: "Professional Certifications", description: "Industry certifications and licenses", urgency: "important" as const },
        { document: "Resume/CV", description: "Updated to destination country format", urgency: "important" as const },
      ],
    });
  }

  if (purpose === "study") {
    baseDocuments.push({
      category: "Education",
      items: [
        { document: "Acceptance Letter", description: "From the educational institution", urgency: "essential" as const },
        { document: "Transcripts", description: "Certified academic records", urgency: "essential" as const },
        { document: "Language Test Scores", description: "IELTS, TOEFL, or equivalent", urgency: "essential" as const },
        { document: "Proof of Tuition Payment", description: "Or scholarship confirmation", urgency: "essential" as const },
      ],
    });
  }

  return {
    country: destinationCountry,
    checklist: baseDocuments,
    resources: [
      {
        name: `${destinationCountry} Immigration`,
        url: `https://www.google.com/search?q=${encodeURIComponent(destinationCountry)}+immigration+document+requirements`,
      },
      {
        name: "Apostille Requirements",
        url: `https://www.google.com/search?q=apostille+documents+for+${encodeURIComponent(destinationCountry)}`,
      },
    ],
  };
}

// Banking Setup Guide
export interface BankingGuideResult {
  country: string;
  steps: { step: string; details: string }[];
  banks: { name: string; url: string; type: string; bestFor: string }[];
  requirements: string[];
  tips: string[];
}

export function getBankingGuide(destinationCountry: string): BankingGuideResult {
  const destLower = destinationCountry.toLowerCase().replace(/\s+/g, "-");

  // Default international-friendly banks
  const internationalBanks = [
    { name: "Wise", url: "https://wise.com/", type: "Digital", bestFor: "Multi-currency accounts, low-fee transfers" },
    { name: "Revolut", url: "https://www.revolut.com/", type: "Digital", bestFor: "Easy setup, travel-friendly" },
    { name: "N26", url: "https://n26.com/", type: "Digital", bestFor: "EU residents, mobile-first banking" },
  ];

  // Country-specific bank suggestions
  const countryBanks: Record<string, { name: string; url: string; type: string; bestFor: string }[]> = {
    germany: [
      { name: "DKB", url: "https://www.dkb.de/", type: "Traditional", bestFor: "Free accounts, good for residents" },
      { name: "Commerzbank", url: "https://www.commerzbank.de/", type: "Traditional", bestFor: "English support, expat-friendly" },
    ],
    uk: [
      { name: "Monzo", url: "https://monzo.com/", type: "Digital", bestFor: "Easy UK banking, no proof of address needed initially" },
      { name: "Starling", url: "https://www.starlingbank.com/", type: "Digital", bestFor: "Full-featured app, good for freelancers" },
    ],
    usa: [
      { name: "Chase", url: "https://www.chase.com/", type: "Traditional", bestFor: "Widespread ATMs, good rewards" },
      { name: "Bank of America", url: "https://www.bankofamerica.com/", type: "Traditional", bestFor: "Expat accounts available" },
    ],
    canada: [
      { name: "TD Bank", url: "https://www.td.com/", type: "Traditional", bestFor: "Newcomer banking packages" },
      { name: "Scotiabank", url: "https://www.scotiabank.com/", type: "Traditional", bestFor: "StartRight program for newcomers" },
    ],
  };

  const banks = [...internationalBanks, ...(countryBanks[destLower] || [])];

  return {
    country: destinationCountry,
    steps: [
      { step: "Get your residence permit/visa", details: "Most banks require proof of legal residence" },
      { step: "Obtain proof of address", details: "Utility bill, rental contract, or official letter" },
      { step: "Prepare ID documents", details: "Passport, visa, and sometimes secondary ID" },
      { step: "Consider a digital bank first", details: "Wise or Revolut can work immediately while you wait for traditional bank approval" },
      { step: "Visit bank branch or apply online", details: "Bring all documents; some banks offer English support" },
      { step: "Set up automatic transfers", details: "For salary, rent, and recurring expenses" },
    ],
    banks,
    requirements: [
      "Valid passport or national ID",
      "Proof of address (varies by bank)",
      "Residence permit or visa",
      "Tax identification number (if available)",
      "Initial deposit (amount varies)",
    ],
    tips: [
      "Open a Wise or Revolut account before you move - works internationally",
      "Some banks have English-speaking staff or expat services",
      "Ask about fees for international transfers if you'll send money home",
      "Consider keeping a bank account in your home country for emergencies",
    ],
  };
}

// Language Learning Resources
export interface LanguageResourcesResult {
  language: string;
  resources: {
    name: string;
    url: string;
    type: "app" | "course" | "community" | "media";
    level: "beginner" | "intermediate" | "advanced" | "all";
    free: boolean;
    bestFor: string;
  }[];
  tips: string[];
}

export function getLanguageResources(destinationCountry: string): LanguageResourcesResult {
  // Map countries to primary languages
  const countryLanguages: Record<string, string> = {
    germany: "German",
    france: "French",
    spain: "Spanish",
    italy: "Italian",
    japan: "Japanese",
    korea: "Korean",
    china: "Chinese (Mandarin)",
    brazil: "Portuguese",
    portugal: "Portuguese",
    netherlands: "Dutch",
    sweden: "Swedish",
    norway: "Norwegian",
    denmark: "Danish",
    russia: "Russian",
    poland: "Polish",
    turkey: "Turkish",
    "united arab emirates": "Arabic",
    "saudi arabia": "Arabic",
    mexico: "Spanish",
    argentina: "Spanish",
    thailand: "Thai",
    vietnam: "Vietnamese",
    indonesia: "Indonesian",
  };

  const destLower = destinationCountry.toLowerCase();
  const language = countryLanguages[destLower] || "the local language";
  const langLower = language.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "");

  return {
    language,
    resources: [
      { name: "Duolingo", url: "https://www.duolingo.com/", type: "app", level: "beginner", free: true, bestFor: "Daily practice, gamified learning" },
      { name: "Babbel", url: "https://www.babbel.com/", type: "app", level: "all", free: false, bestFor: "Conversation-focused, practical phrases" },
      { name: "iTalki", url: "https://www.italki.com/", type: "community", level: "all", free: false, bestFor: "Native speaker tutors, conversation practice" },
      { name: "Pimsleur", url: "https://www.pimsleur.com/", type: "course", level: "beginner", free: false, bestFor: "Audio learning, pronunciation" },
      { name: "Language Exchange", url: "https://www.tandem.net/", type: "community", level: "all", free: true, bestFor: "Practice with native speakers" },
      { name: "YouTube", url: `https://www.youtube.com/results?search_query=learn+${langLower}`, type: "media", level: "all", free: true, bestFor: "Free video lessons, cultural content" },
      { name: "Netflix + Language Reactor", url: "https://www.languagereactor.com/", type: "media", level: "intermediate", free: true, bestFor: "Learn from shows with dual subtitles" },
    ],
    tips: [
      "Aim for 15-30 minutes daily rather than long infrequent sessions",
      "Focus on practical phrases for your daily needs first",
      "Find a language exchange partner or tutor for speaking practice",
      "Immerse yourself: change your phone language, watch local TV",
      "Don't be afraid to make mistakes - locals appreciate the effort",
      "Join local language classes to meet other learners and integrate",
    ],
  };
}

// Job Search for Expats
export interface JobSearchResult {
  country: string;
  platforms: {
    name: string;
    url: string;
    type: "general" | "expat" | "tech" | "remote";
    description: string;
  }[];
  tips: string[];
}

export function getJobSearchResources(
  destinationCountry: string
): JobSearchResult {
  const destLower = destinationCountry.toLowerCase().replace(/\s+/g, "-");
  const destEncoded = encodeURIComponent(destinationCountry);

  // Country-specific job boards
  const countryBoards: Record<string, { name: string; url: string; type: "general" | "expat" | "tech" | "remote"; description: string }[]> = {
    germany: [
      { name: "StepStone", url: "https://www.stepstone.de/", type: "general", description: "Leading German job board" },
      { name: "XING Jobs", url: "https://www.xing.com/jobs", type: "general", description: "Professional network job listings" },
    ],
    uk: [
      { name: "Reed", url: "https://www.reed.co.uk/", type: "general", description: "Major UK job site" },
      { name: "Totaljobs", url: "https://www.totaljobs.com/", type: "general", description: "Wide range of UK positions" },
    ],
    canada: [
      { name: "Indeed Canada", url: "https://ca.indeed.com/", type: "general", description: "Largest Canadian job board" },
      { name: "Job Bank", url: "https://www.jobbank.gc.ca/", type: "general", description: "Government job portal" },
    ],
  };

  const generalPlatforms = [
    { name: "LinkedIn Jobs", url: `https://www.linkedin.com/jobs/search/?location=${destEncoded}`, type: "general" as const, description: "Professional networking and jobs" },
    { name: "Indeed", url: `https://www.indeed.com/jobs?l=${destEncoded}`, type: "general" as const, description: "Global job search engine" },
    { name: "Glassdoor", url: `https://www.glassdoor.com/Job/jobs.htm?locT=N&locId=${destEncoded}`, type: "general" as const, description: "Jobs with company reviews" },
    { name: "Relocate.me", url: "https://relocate.me/", type: "expat" as const, description: "Jobs that offer visa sponsorship" },
    { name: "Landing.jobs", url: "https://landing.jobs/", type: "tech" as const, description: "Tech jobs with relocation support" },
    { name: "Remote OK", url: "https://remoteok.com/", type: "remote" as const, description: "Remote jobs worldwide" },
    { name: "We Work Remotely", url: "https://weworkremotely.com/", type: "remote" as const, description: "Remote jobs from top companies" },
  ];

  const platforms = [...generalPlatforms, ...(countryBoards[destLower] || [])];

  return {
    country: destinationCountry,
    platforms,
    tips: [
      "Update your LinkedIn to show you're open to opportunities in the destination country",
      "Look for companies that specifically mention visa sponsorship",
      "Network with expats already working in your industry there",
      "Consider contract/freelance work initially while building local experience",
      "Tailor your CV to local format and expectations",
      "Learn about salary expectations and cost of living before negotiating",
      "Check if your professional certifications are recognized in the destination country",
    ],
  };
}
