"use client";

import { useState, useRef } from "react";
import { Shield, ChevronRight, Phone, Building2, Heart, MessageSquare, Download, Copy, Check } from "lucide-react";

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
  };
  phrases: { phrase: string; meaning: string }[];
  migrantHelpline?: string;
  healthcareInfo: string;
}

// Emergency info by country
const emergencyData: Record<string, EmergencyInfo> = {
  "United States": {
    emergencyNumber: "911",
    policeNumber: "911",
    ambulanceNumber: "911",
    fireNumber: "911",
    embassy: {
      name: "Your Country's Embassy",
      phone: "Check embassy website",
      address: "Washington DC / Local consulate",
      email: "Contact via embassy website",
    },
    phrases: [
      { phrase: "I need help", meaning: "I need help" },
      { phrase: "Call the police", meaning: "Call the police" },
      { phrase: "I need a doctor", meaning: "I need a doctor" },
      { phrase: "Where is the hospital?", meaning: "Where is the hospital?" },
    ],
    migrantHelpline: "1-888-373-7888",
    healthcareInfo: "Go to nearest ER for emergencies. Urgent care for non-life-threatening issues.",
  },
  "United Kingdom": {
    emergencyNumber: "999",
    policeNumber: "999 or 101 (non-emergency)",
    ambulanceNumber: "999",
    fireNumber: "999",
    embassy: {
      name: "Your Country's Embassy",
      phone: "Check embassy website",
      address: "London / Regional consulate",
      email: "Contact via embassy website",
    },
    phrases: [
      { phrase: "I need help", meaning: "I need help" },
      { phrase: "Call the police", meaning: "Call the police" },
      { phrase: "I need an ambulance", meaning: "I need an ambulance" },
      { phrase: "Where is A&E?", meaning: "Where is the emergency room?" },
    ],
    migrantHelpline: "0808-800-0630",
    healthcareInfo: "NHS provides free emergency care. Register with a GP for ongoing care.",
  },
  "Australia": {
    emergencyNumber: "000",
    policeNumber: "000 or 131 444 (non-emergency)",
    ambulanceNumber: "000",
    fireNumber: "000",
    embassy: {
      name: "Your Country's Embassy/High Commission",
      phone: "Check embassy website",
      address: "Canberra / State consulate",
      email: "Contact via embassy website",
    },
    phrases: [
      { phrase: "I need help", meaning: "I need help" },
      { phrase: "Call triple zero", meaning: "Call emergency services" },
      { phrase: "I need a doctor", meaning: "I need a doctor" },
      { phrase: "Where is the hospital?", meaning: "Where is the hospital?" },
    ],
    migrantHelpline: "1300 135 070",
    healthcareInfo: "Medicare covers some services. Get travel insurance or private health cover.",
  },
  "Canada": {
    emergencyNumber: "911",
    policeNumber: "911 or local non-emergency",
    ambulanceNumber: "911",
    fireNumber: "911",
    embassy: {
      name: "Your Country's Embassy/High Commission",
      phone: "Check embassy website",
      address: "Ottawa / Provincial consulate",
      email: "Contact via embassy website",
    },
    phrases: [
      { phrase: "I need help", meaning: "I need help" },
      { phrase: "Call 911", meaning: "Call emergency services" },
      { phrase: "J'ai besoin d'aide", meaning: "I need help (French)" },
      { phrase: "Where is the hospital?", meaning: "Where is the hospital?" },
    ],
    migrantHelpline: "1-888-242-2100",
    healthcareInfo: "Provincial health insurance varies. Apply ASAP after arrival.",
  },
  "Germany": {
    emergencyNumber: "112",
    policeNumber: "110",
    ambulanceNumber: "112",
    fireNumber: "112",
    embassy: {
      name: "Your Country's Embassy",
      phone: "Check embassy website",
      address: "Berlin / Regional consulate",
      email: "Contact via embassy website",
    },
    phrases: [
      { phrase: "Hilfe!", meaning: "Help!" },
      { phrase: "Rufen Sie die Polizei", meaning: "Call the police" },
      { phrase: "Ich brauche einen Arzt", meaning: "I need a doctor" },
      { phrase: "Wo ist das Krankenhaus?", meaning: "Where is the hospital?" },
    ],
    healthcareInfo: "Health insurance is mandatory. Register with a Krankenkasse.",
  },
};

const defaultEmergencyInfo: EmergencyInfo = {
  emergencyNumber: "Check local emergency number",
  policeNumber: "Check local police number",
  ambulanceNumber: "Check local ambulance number",
  fireNumber: "Check local fire number",
  embassy: {
    name: "Your Country's Embassy",
    phone: "Search online for embassy contact",
    address: "Find via your government website",
    email: "Contact via embassy website",
  },
  phrases: [
    { phrase: "Help!", meaning: "Help!" },
    { phrase: "Police!", meaning: "Police!" },
    { phrase: "Hospital", meaning: "Hospital" },
    { phrase: "Emergency", meaning: "Emergency" },
  ],
  healthcareInfo: "Research local healthcare system before arrival.",
};

export function EmergencyInfoCard({ destination, origin }: EmergencyInfoCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const info = emergencyData[destination] || defaultEmergencyInfo;

  const copyToClipboard = () => {
    const text = `
EMERGENCY CARD - ${destination}
========================
Emergency: ${info.emergencyNumber}
Police: ${info.policeNumber}
Ambulance: ${info.ambulanceNumber}

Embassy: ${info.embassy.name}
Phone: ${info.embassy.phone}

Key Phrases:
${info.phrases.map((p) => `• ${p.phrase} = ${p.meaning}`).join("\n")}

Healthcare: ${info.healthcareInfo}
${info.migrantHelpline ? `Migrant Helpline: ${info.migrantHelpline}` : ""}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {/* Emergency Numbers */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-500 text-white p-4 border-2 border-black text-center">
              <Phone className="mx-auto mb-2" size={24} />
              <p className="text-sm font-bold">EMERGENCY</p>
              <p className="text-2xl font-black">{info.emergencyNumber}</p>
            </div>
            <div className="bg-blue-500 text-white p-4 border-2 border-black text-center">
              <Building2 className="mx-auto mb-2" size={24} />
              <p className="text-sm font-bold">POLICE</p>
              <p className="text-xl font-black">{info.policeNumber.split(" ")[0]}</p>
            </div>
          </div>

          {/* Embassy */}
          <div className="border-2 border-black p-3 mb-4">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Building2 size={18} />
              Embassy / Consulate
            </h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Phone:</span> {info.embassy.phone}</p>
              <p><span className="text-gray-500">Find address:</span> Search &ldquo;{origin} embassy {destination}&rdquo;</p>
            </div>
          </div>

          {/* Key Phrases */}
          <div className="border-2 border-black p-3 mb-4">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <MessageSquare size={18} />
              Emergency Phrases
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {info.phrases.map((phrase, i) => (
                <div key={i} className="bg-gray-50 p-2 text-sm">
                  <p className="font-bold">{phrase.phrase}</p>
                  <p className="text-gray-500 text-xs">{phrase.meaning}</p>
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
          </div>

          {/* Migrant Helpline */}
          {info.migrantHelpline && (
            <div className="border-2 border-purple-500 bg-purple-50 p-3 mb-4">
              <h4 className="font-bold text-purple-700 mb-1">Migrant Support Helpline</h4>
              <p className="text-xl font-black text-purple-700">{info.migrantHelpline}</p>
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

          <p className="text-xs text-gray-500 mt-3 text-center">
            Save this info offline - you may not have internet in an emergency
          </p>
        </div>
      )}
    </div>
  );
}
