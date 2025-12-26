"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCountryByCode } from "@/lib/constants/countries";
import { countryCoordinates } from "@/lib/constants/countryCoordinates";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Globe,
  DollarSign,
  Shield,
  Heart,
  Briefcase,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Plane,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lightbulb,
  Building2,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface CountryData {
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
  cached?: boolean;
}

function ComparisonBadge({
  value,
  higherIsBetter = true,
  label
}: {
  value: number;
  higherIsBetter?: boolean;
  label: string;
}) {
  const isPositive = higherIsBetter ? value > 0 : value < 0;
  const isNeutral = Math.abs(value) < 5;

  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-xs bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">
        <Minus size={12} />
        Similar to {label}
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      isPositive
        ? "bg-green-100 text-green-700 border border-green-300"
        : "bg-red-100 text-red-700 border border-red-300"
    }`}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(value)}% {value > 0 ? "higher" : "lower"} than {label}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  comparison,
  colorClass,
  higherIsBetter = true,
  originName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  comparison?: number;
  colorClass: string;
  higherIsBetter?: boolean;
  originName?: string;
}) {
  return (
    <div className={`${colorClass} border-4 border-black p-4 shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-white border-2 border-black">
          {icon}
        </div>
        {comparison !== undefined && originName && (
          <ComparisonBadge
            value={comparison}
            higherIsBetter={higherIsBetter}
            label={originName}
          />
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function CityCard({ city, index }: { city: CountryData["cities"][0]; index: number }) {
  const colors = ["bg-pink-100", "bg-blue-100", "bg-green-100", "bg-purple-100", "bg-orange-100"];

  return (
    <div className={`${colors[index % colors.length]} border-4 border-black p-5 shadow-[4px_4px_0_0_#000]`}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={20} className="text-gray-700" />
        <h3 className="font-bold text-lg">{city.name}</h3>
        <span className="text-sm text-gray-600">({city.population})</span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{city.description}</p>
      <div className="flex flex-wrap gap-2">
        {city.highlights.map((highlight, i) => (
          <span
            key={i}
            className="bg-white border-2 border-black px-2 py-1 text-xs font-medium"
          >
            {highlight}
          </span>
        ))}
      </div>
    </div>
  );
}

function VisaCard({ visa }: { visa: CountryData["visaOptions"][0] }) {
  const typeColors: Record<string, string> = {
    work: "bg-blue-100",
    student: "bg-green-100",
    family: "bg-pink-100",
    investor: "bg-yellow-100",
    digital_nomad: "bg-purple-100",
  };

  return (
    <div className={`${typeColors[visa.type] || "bg-gray-100"} border-4 border-black p-5 shadow-[4px_4px_0_0_#000]`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">{visa.name}</h3>
        <span className="bg-white border-2 border-black px-2 py-1 text-xs font-bold uppercase">
          {visa.type.replace("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-xs text-gray-500 uppercase">Processing</div>
          <div className="font-medium flex items-center gap-1">
            <Clock size={14} />
            {visa.processingTime}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">Duration</div>
          <div className="font-medium">{visa.duration}</div>
        </div>
      </div>
      <div className="space-y-1">
        {visa.requirements.slice(0, 4).map((req, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <FileText size={14} className="mt-0.5 shrink-0" />
            <span>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CountryDetailPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const country = getCountryByCode(code);
  const profile = useQuery(api.users.getProfile);

  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Get origin country for comparison
  const originCountry = profile?.originCountry ? getCountryByCode(profile.originCountry) : null;

  // Fetch country data
  useEffect(() => {
    if (!country) return;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/country-data?code=${code}&name=${country?.name}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCountryData(data);
      } catch (err) {
        console.error("Error fetching country data:", err);
        setError("Failed to load country data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [code, country]);

  // City coordinates for major cities (used for map markers)
  const cityCoordinates: Record<string, Record<string, [number, number]>> = {
    DE: {
      Berlin: [13.41, 52.52],
      Munich: [11.58, 48.14],
      Frankfurt: [8.68, 50.11],
      Hamburg: [9.99, 53.55],
    },
    US: {
      "New York City": [-74.01, 40.71],
      "San Francisco": [-122.42, 37.77],
      Austin: [-97.74, 30.27],
      "Los Angeles": [-118.24, 34.05],
    },
    CA: {
      Toronto: [-79.38, 43.65],
      Vancouver: [-123.12, 49.28],
      Montreal: [-73.57, 45.50],
      Calgary: [-114.07, 51.05],
    },
    AU: {
      Sydney: [151.21, -33.87],
      Melbourne: [144.96, -37.81],
      Brisbane: [153.03, -27.47],
      Perth: [115.86, -31.95],
    },
    GB: {
      London: [-0.13, 51.51],
      Manchester: [-2.24, 53.48],
      Edinburgh: [-3.19, 55.95],
      Birmingham: [-1.90, 52.49],
    },
    NL: {
      Amsterdam: [4.90, 52.37],
      Rotterdam: [4.48, 51.92],
      "The Hague": [4.30, 52.08],
      Utrecht: [5.12, 52.09],
    },
    SG: {
      Singapore: [103.85, 1.29],
    },
    AE: {
      Dubai: [55.27, 25.20],
      "Abu Dhabi": [54.37, 24.45],
    },
  };

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current || !country) return;

    const coords = countryCoordinates[code];
    if (!coords) return;

    // coords is [lng, lat] tuple
    const [lng, lat] = coords;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [lng, lat],
      zoom: 4,
      interactive: true,
    });

    // Add markers for major cities
    const cities = cityCoordinates[code];
    if (cities) {
      Object.entries(cities).forEach(([cityName, cityCoords], index) => {
        // Use different colors for different cities
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
        const color = colors[index % colors.length];

        new mapboxgl.Marker({ color })
          .setLngLat(cityCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 4px;">
                <strong style="font-size: 14px;">${cityName}</strong>
                <p style="font-size: 12px; margin: 4px 0 0; color: #666;">Click for details</p>
              </div>`
            )
          )
          .addTo(map.current!);
      });
    } else {
      // Fallback: add a single marker for the capital
      new mapboxgl.Marker({ color: "#000" })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${country.name}</strong>`))
        .addTo(map.current);
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [code, country]);

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Country not found</h1>
            <Link href="/dashboard" className="text-blue-600 underline">
              Return to dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-orange-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Map */}
        <div className="relative">
          <div
            ref={mapContainer}
            className="h-[300px] md:h-[400px] w-full"
          />

          {/* Country Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="container mx-auto">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 text-sm"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-6xl">{country.flag}</span>
                <div>
                  <h1 className="text-4xl md:text-5xl font-head text-white">{country.name}</h1>
                  {originCountry && (
                    <p className="text-white/80 text-lg">
                      Comparing with your home: {originCountry.flag} {originCountry.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-lg font-medium">Loading country data...</p>
              <p className="text-sm text-gray-600">Powered by AI + real-time research</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-4 border-black p-6 text-center">
              <AlertCircle className="mx-auto mb-2" size={32} />
              <p className="font-bold">{error}</p>
            </div>
          ) : countryData ? (
            <div className="space-y-8">
              {/* Quick Facts Grid */}
              <section>
                <h2 className="text-2xl font-head mb-4 flex items-center gap-2">
                  <Globe size={24} />
                  Quick Facts
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                    <div className="text-sm text-gray-500">Capital</div>
                    <div className="font-bold text-lg">{countryData.capital}</div>
                  </div>
                  <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                    <div className="text-sm text-gray-500">Population</div>
                    <div className="font-bold text-lg">{countryData.population}</div>
                  </div>
                  <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                    <div className="text-sm text-gray-500">Currency</div>
                    <div className="font-bold text-lg">{countryData.currency}</div>
                  </div>
                  <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                    <div className="text-sm text-gray-500">Language</div>
                    <div className="font-bold text-lg">{countryData.language}</div>
                  </div>
                </div>
              </section>

              {/* Key Metrics with Comparison */}
              <section>
                <h2 className="text-2xl font-head mb-4 flex items-center gap-2">
                  <TrendingUp size={24} />
                  Key Metrics
                  {originCountry && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      (compared to {originCountry.name})
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard
                    icon={<DollarSign size={24} />}
                    label="Cost of Living Index"
                    value={countryData.metrics.costOfLivingIndex}
                    subtext="NYC = 100 baseline"
                    colorClass="bg-green-100"
                    higherIsBetter={false}
                    originName={originCountry?.name}
                  />
                  <MetricCard
                    icon={<Building2 size={24} />}
                    label="Average Rent (1BR)"
                    value={`$${countryData.metrics.averageRentUSD?.toLocaleString() || "N/A"}/mo`}
                    colorClass="bg-blue-100"
                    higherIsBetter={false}
                    originName={originCountry?.name}
                  />
                  <MetricCard
                    icon={<Shield size={24} />}
                    label="Safety Index"
                    value={`${countryData.metrics.safetyIndex}/100`}
                    colorClass="bg-purple-100"
                    originName={originCountry?.name}
                  />
                  <MetricCard
                    icon={<Heart size={24} />}
                    label="Healthcare Index"
                    value={`${countryData.metrics.healthcareIndex}/100`}
                    colorClass="bg-pink-100"
                    originName={originCountry?.name}
                  />
                  <MetricCard
                    icon={<Sparkles size={24} />}
                    label="Quality of Life"
                    value={`${countryData.metrics.qualityOfLifeIndex}/100`}
                    colorClass="bg-yellow-100"
                    originName={originCountry?.name}
                  />
                  <MetricCard
                    icon={<Briefcase size={24} />}
                    label="Average Salary"
                    value={`$${countryData.metrics.averageSalaryUSD?.toLocaleString() || "N/A"}/yr`}
                    subtext={`Unemployment: ${countryData.metrics.unemploymentRate}%`}
                    colorClass="bg-orange-100"
                    originName={originCountry?.name}
                  />
                </div>
              </section>

              {/* Popular Cities */}
              {countryData.cities && countryData.cities.length > 0 && (
                <section>
                  <h2 className="text-2xl font-head mb-4 flex items-center gap-2">
                    <MapPin size={24} />
                    Popular Cities for Expats
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countryData.cities.map((city, i) => (
                      <CityCard key={city.name} city={city} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Advantages & Challenges */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                  <h2 className="text-xl font-head mb-4 flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={24} />
                    Advantages
                  </h2>
                  <ul className="space-y-3">
                    {countryData.advantages?.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">+</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                  <h2 className="text-xl font-head mb-4 flex items-center gap-2 text-red-700">
                    <AlertCircle size={24} />
                    Challenges
                  </h2>
                  <ul className="space-y-3">
                    {countryData.challenges?.map((ch, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">×</span>
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Visa Options */}
              {countryData.visaOptions && countryData.visaOptions.length > 0 && (
                <section>
                  <h2 className="text-2xl font-head mb-4 flex items-center gap-2">
                    <Plane size={24} />
                    Visa Options
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countryData.visaOptions.map((visa, i) => (
                      <VisaCard key={i} visa={visa} />
                    ))}
                  </div>
                </section>
              )}

              {/* Work Culture */}
              {countryData.workCulture && (
                <section className="bg-blue-50 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                  <h2 className="text-xl font-head mb-3 flex items-center gap-2">
                    <Briefcase size={24} />
                    Work Culture
                  </h2>
                  <p className="text-gray-700">{countryData.workCulture}</p>
                </section>
              )}

              {/* Living Tips */}
              {countryData.livingTips && countryData.livingTips.length > 0 && (
                <section className="bg-yellow-50 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                  <h2 className="text-xl font-head mb-4 flex items-center gap-2">
                    <Lightbulb size={24} />
                    Essential Tips for New Arrivals
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {countryData.livingTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white border-2 border-black p-3">
                        <span className="bg-yellow-400 border-2 border-black w-6 h-6 flex items-center justify-center font-bold text-sm shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Data Attribution */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>
                  Data powered by AI research • Updated {countryData.cached ? "from cache" : "in real-time"}
                </p>
                <p className="mt-1">
                  Always verify visa requirements with official government sources
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
