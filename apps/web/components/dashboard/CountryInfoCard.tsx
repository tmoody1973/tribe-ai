"use client";

import Link from "next/link";
import { getCountryByCode } from "@/lib/constants/countries";
import { ArrowRight, Globe, Info } from "lucide-react";

interface CountryInfoCardProps {
  destination: string;
  origin: string;
}

export function CountryInfoCard({ destination, origin }: CountryInfoCardProps) {
  const destCountry = getCountryByCode(destination);
  const originCountry = getCountryByCode(origin);

  if (!destCountry) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 border-b-4 border-black p-4 text-white">
        <div className="flex items-center gap-2">
          <Globe size={20} />
          <h3 className="font-head text-lg">Destination Guide</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{destCountry.flag}</span>
          <div>
            <h4 className="font-bold text-lg">{destCountry.name}</h4>
            <p className="text-sm text-gray-600">
              Explore cost of living, visas, cities & more
            </p>
          </div>
        </div>

        {/* Quick highlights */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white border-2 border-black p-2">
            <div className="text-xs text-gray-500">Compare with</div>
            <div className="font-medium text-sm">
              {originCountry?.flag} {originCountry?.name || "Your country"}
            </div>
          </div>
          <div className="bg-white border-2 border-black p-2">
            <div className="text-xs text-gray-500">Data includes</div>
            <div className="font-medium text-sm">
              Real-time costs & visas
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href={`/country/${destination}`}
          className="flex items-center justify-center gap-2 w-full bg-black text-white border-4 border-black py-3 font-bold hover:bg-gray-800 transition-colors"
        >
          <Info size={18} />
          View Full Country Guide
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
