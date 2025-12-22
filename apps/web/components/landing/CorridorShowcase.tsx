"use client";

import { ArrowRight } from "lucide-react";

interface Corridor {
  from: { code: string; name: string; flag: string };
  to: { code: string; name: string; flag: string };
  migrants: string;
  color: string;
}

const popularCorridors: Corridor[] = [
  {
    from: { code: "MX", name: "Mexico", flag: "🇲🇽" },
    to: { code: "US", name: "USA", flag: "🇺🇸" },
    migrants: "11M+",
    color: "bg-red-100",
  },
  {
    from: { code: "IN", name: "India", flag: "🇮🇳" },
    to: { code: "US", name: "USA", flag: "🇺🇸" },
    migrants: "2.7M+",
    color: "bg-orange-100",
  },
  {
    from: { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    to: { code: "UK", name: "UK", flag: "🇬🇧" },
    migrants: "250K+",
    color: "bg-green-100",
  },
  {
    from: { code: "PH", name: "Philippines", flag: "🇵🇭" },
    to: { code: "CA", name: "Canada", flag: "🇨🇦" },
    migrants: "900K+",
    color: "bg-blue-100",
  },
  {
    from: { code: "BR", name: "Brazil", flag: "🇧🇷" },
    to: { code: "PT", name: "Portugal", flag: "🇵🇹" },
    migrants: "200K+",
    color: "bg-yellow-100",
  },
  {
    from: { code: "CN", name: "China", flag: "🇨🇳" },
    to: { code: "AU", name: "Australia", flag: "🇦🇺" },
    migrants: "650K+",
    color: "bg-purple-100",
  },
];

export function CorridorShowcase() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {popularCorridors.map((corridor, i) => (
        <div
          key={i}
          className={`
            ${corridor.color}
            border-4 border-black p-4
            shadow-[4px_4px_0_0_#000]
            hover:shadow-[2px_2px_0_0_#000]
            hover:translate-x-[2px] hover:translate-y-[2px]
            transition-all duration-200
            cursor-pointer
          `}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl" role="img" aria-label={corridor.from.name}>
              {corridor.from.flag}
            </span>
            <ArrowRight className="w-5 h-5" />
            <span className="text-3xl" role="img" aria-label={corridor.to.name}>
              {corridor.to.flag}
            </span>
          </div>
          <div className="text-center">
            <div className="font-bold text-sm">
              {corridor.from.code} → {corridor.to.code}
            </div>
            <div className="text-xs text-gray-600">{corridor.migrants} migrants</div>
          </div>
        </div>
      ))}
    </div>
  );
}
