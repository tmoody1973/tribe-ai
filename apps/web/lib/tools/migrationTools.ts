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
