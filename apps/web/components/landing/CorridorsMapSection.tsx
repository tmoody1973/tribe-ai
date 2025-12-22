"use client";

import { useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";

interface Corridor {
  from: { code: string; name: string; flag: string; x: number; y: number };
  to: { code: string; name: string; flag: string; x: number; y: number };
  migrants: string;
  trend: "up" | "stable";
  color: string;
}

const corridors: Corridor[] = [
  {
    from: { code: "MX", name: "Mexico", flag: "🇲🇽", x: 80, y: 100 },
    to: { code: "US", name: "United States", flag: "🇺🇸", x: 100, y: 70 },
    migrants: "11M+",
    trend: "stable",
    color: "#ef4444",
  },
  {
    from: { code: "IN", name: "India", flag: "🇮🇳", x: 290, y: 110 },
    to: { code: "US", name: "United States", flag: "🇺🇸", x: 100, y: 70 },
    migrants: "2.7M+",
    trend: "up",
    color: "#f97316",
  },
  {
    from: { code: "NG", name: "Nigeria", flag: "🇳🇬", x: 195, y: 140 },
    to: { code: "UK", name: "United Kingdom", flag: "🇬🇧", x: 185, y: 65 },
    migrants: "250K+",
    trend: "up",
    color: "#22c55e",
  },
  {
    from: { code: "PH", name: "Philippines", flag: "🇵🇭", x: 340, y: 130 },
    to: { code: "CA", name: "Canada", flag: "🇨🇦", x: 90, y: 50 },
    migrants: "900K+",
    trend: "up",
    color: "#3b82f6",
  },
  {
    from: { code: "BR", name: "Brazil", flag: "🇧🇷", x: 130, y: 170 },
    to: { code: "PT", name: "Portugal", flag: "🇵🇹", x: 175, y: 80 },
    migrants: "200K+",
    trend: "up",
    color: "#eab308",
  },
  {
    from: { code: "CN", name: "China", flag: "🇨🇳", x: 320, y: 90 },
    to: { code: "AU", name: "Australia", flag: "🇦🇺", x: 360, y: 180 },
    migrants: "650K+",
    trend: "stable",
    color: "#8b5cf6",
  },
];

interface CorridorsMapSectionProps {
  title: string;
  subtitle: string;
}

export function CorridorsMapSection({ title, subtitle }: CorridorsMapSectionProps) {
  const [hoveredCorridor, setHoveredCorridor] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-amber-50 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-head text-4xl md:text-5xl mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Interactive map */}
        <div className="relative max-w-5xl mx-auto">
          <div className="border-4 border-black shadow-[8px_8px_0_0_#000] bg-cyan-100 rounded-lg overflow-hidden">
            <svg viewBox="0 0 420 240" className="w-full h-auto">
              {/* Ocean background */}
              <rect width="420" height="240" fill="#bae6fd" />

              {/* Grid pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#7dd3fc" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="420" height="240" fill="url(#grid)" />

              {/* Simplified continents */}
              <g fill="#4ade80" stroke="#166534" strokeWidth="1.5">
                {/* North America */}
                <path d="M 50,40 Q 80,25 120,35 L 130,80 Q 100,110 60,95 Q 45,70 50,40 Z" />
                {/* South America */}
                <path d="M 100,130 Q 120,120 135,135 L 130,195 Q 105,210 95,180 Q 90,150 100,130 Z" />
                {/* Europe */}
                <path d="M 170,50 Q 200,35 220,50 L 220,85 Q 195,95 170,80 Z" />
                {/* Africa */}
                <path d="M 175,100 Q 210,90 230,110 L 225,175 Q 195,190 175,160 Z" />
                {/* Asia */}
                <path d="M 230,30 Q 300,20 370,50 L 360,120 Q 300,140 240,100 Z" />
                {/* Australia */}
                <path d="M 340,160 Q 375,150 395,170 L 390,200 Q 355,215 340,195 Z" />
              </g>

              {/* Migration corridors */}
              {corridors.map((corridor, i) => {
                const isHovered = hoveredCorridor === i;
                const midX = (corridor.from.x + corridor.to.x) / 2;
                const midY = Math.min(corridor.from.y, corridor.to.y) - 30;

                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCorridor(i)}
                    onMouseLeave={() => setHoveredCorridor(null)}
                  >
                    {/* Path */}
                    <path
                      d={`M ${corridor.from.x} ${corridor.from.y} Q ${midX} ${midY} ${corridor.to.x} ${corridor.to.y}`}
                      fill="none"
                      stroke={corridor.color}
                      strokeWidth={isHovered ? 4 : 2}
                      strokeDasharray={isHovered ? "0" : "6,4"}
                      opacity={isHovered ? 1 : 0.7}
                      className="transition-all duration-200"
                    />

                    {/* Origin marker */}
                    <circle
                      cx={corridor.from.x}
                      cy={corridor.from.y}
                      r={isHovered ? 8 : 5}
                      fill={corridor.color}
                      stroke="#000"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    {/* Destination marker */}
                    <circle
                      cx={corridor.to.x}
                      cy={corridor.to.y}
                      r={isHovered ? 10 : 7}
                      fill={corridor.color}
                      stroke="#000"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    {/* Animated dot on path */}
                    {isHovered && (
                      <circle r="4" fill="white" stroke={corridor.color} strokeWidth="2">
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M ${corridor.from.x} ${corridor.from.y} Q ${midX} ${midY} ${corridor.to.x} ${corridor.to.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Corridor cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            {corridors.map((corridor, i) => (
              <div
                key={i}
                className={`
                  bg-white border-3 border-black p-3
                  shadow-[3px_3px_0_0_#000]
                  hover:shadow-[1px_1px_0_0_#000]
                  hover:translate-x-[2px] hover:translate-y-[2px]
                  transition-all duration-200 cursor-pointer
                  ${hoveredCorridor === i ? "ring-2 ring-offset-2" : ""}
                `}
                style={{
                  borderLeftColor: corridor.color,
                  borderLeftWidth: "6px",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": corridor.color,
                }}
                onMouseEnter={() => setHoveredCorridor(i)}
                onMouseLeave={() => setHoveredCorridor(null)}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xl">{corridor.from.flag}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-xl">{corridor.to.flag}</span>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xs">
                    {corridor.from.code} → {corridor.to.code}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <span>{corridor.migrants}</span>
                    {corridor.trend === "up" && (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
