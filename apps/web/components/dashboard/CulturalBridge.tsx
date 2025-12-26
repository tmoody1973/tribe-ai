"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getCountryByCode } from "@/lib/constants/countries";
import { ArrowRight, Sparkles, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface CulturalDimension {
  dimension: string;
  origin: string;
  destination: string;
  originScore: number; // 0-100
  destinationScore: number; // 0-100
  insight: string;
  adaptation: string;
  difficulty: "easy" | "moderate" | "challenging";
}

interface CulturalBridgeData {
  dimensions: CulturalDimension[];
  overallCompatibility: number; // 0-100
  keyAdaptations: string[];
  strengthsToLeverage: string[];
  generatedAt: number;
}

interface CulturalBridgeProps {
  origin: string;
  destination: string;
}

const difficultyColors = {
  easy: { bg: "bg-green-100", text: "text-green-800", border: "border-green-400" },
  moderate: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-400" },
  challenging: { bg: "bg-red-100", text: "text-red-800", border: "border-red-400" },
};

const difficultyIcons = {
  easy: <CheckCircle size={16} className="text-green-600" />,
  moderate: <AlertTriangle size={16} className="text-yellow-600" />,
  challenging: <AlertTriangle size={16} className="text-red-600" />,
};

export function CulturalBridge({ origin, destination }: CulturalBridgeProps) {
  const [bridgeData, setBridgeData] = useState<CulturalBridgeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get cultural profile if exists
  const culturalProfile = useQuery(api.cultural.profile.getProfile);

  const originCountry = getCountryByCode(origin);
  const destCountry = getCountryByCode(destination);

  useEffect(() => {
    async function fetchBridgeData() {
      if (!origin || !destination) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/cultural-bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            originCountryName: originCountry?.name,
            destinationCountryName: destCountry?.name,
            culturalProfile: culturalProfile ? {
              originCulture: culturalProfile.originCulture,
              communicationStyle: culturalProfile.communicationStyle,
              familyStructure: culturalProfile.familyStructure,
              timeOrientation: culturalProfile.timeOrientation,
              values: culturalProfile.values,
            } : null,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch cultural bridge data");

        const data = await response.json();
        setBridgeData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBridgeData();
  }, [origin, destination, originCountry?.name, destCountry?.name, culturalProfile]);

  if (!originCountry || !destCountry) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 border-b-4 border-black p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h3 className="font-head text-lg">Cultural Bridge</h3>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">AI-Powered</span>
        </div>
        <p className="text-sm text-purple-100 mt-1">
          How your culture translates to your destination
        </p>
      </div>

      {/* Culture Comparison Header */}
      <div className="p-4 border-b-2 border-purple-200 bg-white/50">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <span className="text-3xl">{originCountry.flag}</span>
            <p className="font-bold text-sm mt-1">{originCountry.name}</p>
            <p className="text-xs text-gray-500">Your Culture</p>
          </div>
          <div className="flex items-center gap-2 px-4">
            <div className="w-8 h-0.5 bg-purple-300"></div>
            <ArrowRight size={24} className="text-purple-600" />
            <div className="w-8 h-0.5 bg-purple-300"></div>
          </div>
          <div className="text-center">
            <span className="text-3xl">{destCountry.flag}</span>
            <p className="font-bold text-sm mt-1">{destCountry.name}</p>
            <p className="text-xs text-gray-500">Destination</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 size={32} className="animate-spin text-purple-600" />
            <p className="text-sm text-gray-600 animate-pulse">
              Analyzing cultural dimensions...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-4 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {bridgeData && (
          <>
            {/* Compatibility Score */}
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-4 py-2">
                <span className="text-sm font-medium">Cultural Compatibility:</span>
                <span className={`text-2xl font-black ${
                  bridgeData.overallCompatibility >= 70 ? "text-green-600" :
                  bridgeData.overallCompatibility >= 40 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {bridgeData.overallCompatibility}%
                </span>
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-3">
              {bridgeData.dimensions.slice(0, isExpanded ? undefined : 3).map((dim, index) => (
                <div
                  key={index}
                  className={`bg-white border-2 ${difficultyColors[dim.difficulty].border} p-3`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{dim.dimension}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${difficultyColors[dim.difficulty].bg} ${difficultyColors[dim.difficulty].text}`}>
                      {difficultyIcons[dim.difficulty]}
                      {dim.difficulty}
                    </span>
                  </div>

                  {/* Visual Scale */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs w-20 text-right truncate">{dim.origin}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
                      <div
                        className="absolute h-4 w-4 bg-purple-500 border-2 border-white rounded-full -top-1 shadow"
                        style={{ left: `calc(${dim.originScore}% - 8px)` }}
                        title={`${originCountry.name}: ${dim.origin}`}
                      />
                      <div
                        className="absolute h-4 w-4 bg-indigo-500 border-2 border-white rounded-full -top-1 shadow"
                        style={{ left: `calc(${dim.destinationScore}% - 8px)` }}
                        title={`${destCountry.name}: ${dim.destination}`}
                      />
                    </div>
                    <span className="text-xs w-20 truncate">{dim.destination}</span>
                  </div>

                  <p className="text-xs text-gray-600 mb-1">{dim.insight}</p>
                  <p className="text-xs font-medium text-purple-700">
                    Tip: {dim.adaptation}
                  </p>
                </div>
              ))}
            </div>

            {bridgeData.dimensions.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-3 py-2 text-sm font-bold text-purple-600 hover:bg-purple-100 transition-colors"
              >
                {isExpanded ? "Show Less" : `Show ${bridgeData.dimensions.length - 3} More Dimensions`}
              </button>
            )}

            {/* Key Adaptations */}
            {isExpanded && bridgeData.keyAdaptations.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-300">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  Key Adaptations Needed
                </h4>
                <ul className="space-y-1">
                  {bridgeData.keyAdaptations.map((adaptation, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      {adaptation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {isExpanded && bridgeData.strengthsToLeverage.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border-2 border-green-300">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Your Cultural Strengths
                </h4>
                <ul className="space-y-1">
                  {bridgeData.strengthsToLeverage.map((strength, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
