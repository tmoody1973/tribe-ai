"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Shield,
  ChevronRight,
  Phone,
  Building2,
  Heart,
  MessageSquare,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
} from "lucide-react";

interface EmergencyInfoCardProps {
  destination: string;
  origin: string;
}

interface EmergencyInfo {
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
  phrases: { phrase: string; meaning: string; pronunciation?: string }[];
  healthcareInfo: string;
  healthcareEmergency?: string;
  migrantHelpline?: string;
  mentalHealthHotline?: string;
  domesticViolenceHotline?: string;
  localEmergencyApp?: string;
  insuranceInfo?: string;
  confidence?: string;
  sourceUrls?: string[];
}

export function EmergencyInfoCard({ destination, origin }: EmergencyInfoCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localData, setLocalData] = useState<EmergencyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Try to get cached data from Convex first
  const cachedData = useQuery(api.emergencyInfo.getEmergencyInfo, {
    origin,
    destination,
  });

  const fetchEmergencyInfo = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/emergency-info?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${forceRefresh ? "&refresh=true" : ""}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLocalData(data);
    } catch (err) {
      setError("Could not load emergency info. Check your connection.");
      console.error("Emergency info fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination]);

  // Fetch fresh data when opened and no cache
  useEffect(() => {
    if (isOpen && !cachedData && !localData && !isLoading) {
      fetchEmergencyInfo();
    }
  }, [isOpen, cachedData, localData, isLoading, fetchEmergencyInfo]);

  // Use cached data, local data, or show loading state
  const info: EmergencyInfo | null = cachedData || localData;

  const copyToClipboard = () => {
    if (!info) return;
    const text = `
EMERGENCY CARD - ${destination}
========================
Emergency: ${info.emergencyNumber}
Police: ${info.policeNumber}
Ambulance: ${info.ambulanceNumber}

${origin} Embassy in ${destination}:
${info.embassy.name}
Phone: ${info.embassy.phone}
Address: ${info.embassy.address}
${info.embassy.website ? `Website: ${info.embassy.website}` : ""}

Key Phrases:
${info.phrases.map((p) => `• ${p.phrase} = ${p.meaning}${p.pronunciation ? ` (${p.pronunciation})` : ""}`).join("\n")}

Healthcare: ${info.healthcareInfo}
${info.migrantHelpline ? `Migrant Helpline: ${info.migrantHelpline}` : ""}
${info.mentalHealthHotline ? `Mental Health: ${info.mentalHealthHotline}` : ""}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-500 mr-2" size={24} />
          <span className="text-gray-600">Researching emergency info for {destination}...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchEmergencyInfo(true)}
            className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 font-bold border-2 border-black"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }

    if (!info) {
      return (
        <div className="text-center py-8">
          <Shield className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-gray-500">Loading emergency information...</p>
        </div>
      );
    }

    return (
      <>
        {/* Confidence Indicator */}
        {info.confidence && info.confidence !== "high" && (
          <div className="bg-yellow-50 border-2 border-yellow-400 p-2 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-700">
              Some data may need verification. Confirm with official sources.
            </span>
          </div>
        )}

        {/* Emergency Numbers */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href={`tel:${info.emergencyNumber.replace(/[^0-9]/g, "")}`}
            className="bg-red-500 text-white p-4 border-2 border-black text-center hover:bg-red-600 transition-colors"
          >
            <Phone className="mx-auto mb-2" size={24} />
            <p className="text-sm font-bold">EMERGENCY</p>
            <p className="text-2xl font-black">{info.emergencyNumber}</p>
          </a>
          <a
            href={`tel:${info.policeNumber.split(" ")[0].replace(/[^0-9]/g, "")}`}
            className="bg-blue-500 text-white p-4 border-2 border-black text-center hover:bg-blue-600 transition-colors"
          >
            <Building2 className="mx-auto mb-2" size={24} />
            <p className="text-sm font-bold">POLICE</p>
            <p className="text-xl font-black">{info.policeNumber.split(" ")[0]}</p>
          </a>
        </div>

        {/* Additional Emergency Numbers */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="bg-gray-100 p-2 border border-gray-300">
            <span className="text-gray-500">Ambulance:</span>{" "}
            <span className="font-bold">{info.ambulanceNumber}</span>
          </div>
          <div className="bg-gray-100 p-2 border border-gray-300">
            <span className="text-gray-500">Fire:</span>{" "}
            <span className="font-bold">{info.fireNumber}</span>
          </div>
        </div>

        {/* Embassy */}
        <div className="border-2 border-black p-3 mb-4">
          <h4 className="font-bold flex items-center gap-2 mb-2">
            <Building2 size={18} />
            {info.embassy.name}
          </h4>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500">Phone:</span>{" "}
              <a href={`tel:${info.embassy.phone.replace(/[^0-9+]/g, "")}`} className="font-medium text-blue-600 hover:underline">
                {info.embassy.phone}
              </a>
            </p>
            <p>
              <span className="text-gray-500">Address:</span>{" "}
              <span className="font-medium">{info.embassy.address}</span>
            </p>
            {info.embassy.website && (
              <p>
                <a
                  href={info.embassy.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <Globe size={14} />
                  Embassy Website
                  <ExternalLink size={12} />
                </a>
              </p>
            )}
            {info.embassy.hours && (
              <p className="text-gray-500 text-xs">{info.embassy.hours}</p>
            )}
          </div>
        </div>

        {/* Key Phrases */}
        <div className="border-2 border-black p-3 mb-4">
          <h4 className="font-bold flex items-center gap-2 mb-2">
            <MessageSquare size={18} />
            Emergency Phrases
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {info.phrases.slice(0, 8).map((phrase, i) => (
              <div key={i} className="bg-gray-50 p-2 text-sm">
                <p className="font-bold">{phrase.phrase}</p>
                <p className="text-gray-500 text-xs">{phrase.meaning}</p>
                {phrase.pronunciation && (
                  <p className="text-blue-500 text-xs italic">{phrase.pronunciation}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Healthcare */}
        <div className="border-2 border-black p-3 mb-4 bg-green-50">
          <h4 className="font-bold flex items-center gap-2 mb-2">
            <Heart size={18} className="text-green-600" />
            Healthcare
          </h4>
          <p className="text-sm">{info.healthcareInfo}</p>
          {info.healthcareEmergency && (
            <p className="text-sm mt-2 text-green-700">{info.healthcareEmergency}</p>
          )}
        </div>

        {/* Support Hotlines */}
        <div className="space-y-2 mb-4">
          {info.migrantHelpline && (
            <div className="border-2 border-purple-500 bg-purple-50 p-3">
              <h4 className="font-bold text-purple-700 mb-1">Migrant Support Helpline</h4>
              <a
                href={`tel:${info.migrantHelpline.replace(/[^0-9+]/g, "")}`}
                className="text-xl font-black text-purple-700 hover:underline"
              >
                {info.migrantHelpline}
              </a>
            </div>
          )}
          {info.mentalHealthHotline && (
            <div className="border border-blue-300 bg-blue-50 p-2 text-sm">
              <span className="font-bold text-blue-700">Mental Health Crisis:</span>{" "}
              <a href={`tel:${info.mentalHealthHotline.replace(/[^0-9+]/g, "")}`} className="text-blue-700 hover:underline">
                {info.mentalHealthHotline}
              </a>
            </div>
          )}
          {info.domesticViolenceHotline && (
            <div className="border border-pink-300 bg-pink-50 p-2 text-sm">
              <span className="font-bold text-pink-700">DV Helpline:</span>{" "}
              <a href={`tel:${info.domesticViolenceHotline.replace(/[^0-9+]/g, "")}`} className="text-pink-700 hover:underline">
                {info.domesticViolenceHotline}
              </a>
            </div>
          )}
        </div>

        {/* Local Emergency App */}
        {info.localEmergencyApp && (
          <div className="bg-gray-100 p-2 mb-4 text-sm border border-gray-300">
            <span className="font-bold">Official Emergency App:</span> {info.localEmergencyApp}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className={`
              flex-1 py-3 font-bold border-2 border-black flex items-center justify-center gap-2
              ${copied ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200"}
            `}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copied!" : "Copy to Notes"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 font-bold border-2 border-black bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Print Card
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            Save this info offline - you may not have internet in an emergency
          </p>
          <button
            onClick={() => fetchEmergencyInfo(true)}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 border-2 border-black flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Emergency Info Card</h3>
            <p className="text-sm text-gray-600">Critical contacts for {destination}</p>
          </div>
        </div>
        <ChevronRight
          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
          size={20}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t-4 border-black p-4" ref={cardRef}>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
