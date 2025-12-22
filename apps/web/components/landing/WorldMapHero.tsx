"use client";

import { useEffect, useState } from "react";

// Simplified world map paths for key regions
const regions = {
  northAmerica: "M 50,80 Q 80,60 120,70 L 130,90 Q 100,120 60,110 Z",
  southAmerica: "M 90,140 Q 110,130 120,145 L 115,190 Q 95,200 85,180 Z",
  europe: "M 180,65 Q 210,55 230,70 L 225,90 Q 200,95 175,85 Z",
  africa: "M 175,100 Q 200,90 220,105 L 215,160 Q 190,170 170,150 Z",
  asia: "M 240,50 Q 300,40 340,70 L 330,120 Q 280,130 240,100 Z",
  oceania: "M 300,150 Q 330,140 350,155 L 345,175 Q 315,185 295,170 Z",
};

// Migration corridor animations
const corridors = [
  { from: { x: 100, y: 95 }, to: { x: 205, y: 75 }, color: "#f97316" }, // MX -> EU
  { from: { x: 190, y: 130 }, to: { x: 205, y: 75 }, color: "#8b5cf6" }, // Africa -> EU
  { from: { x: 280, y: 80 }, to: { x: 110, y: 85 }, color: "#06b6d4" }, // Asia -> NA
  { from: { x: 100, y: 160 }, to: { x: 110, y: 85 }, color: "#22c55e" }, // SA -> NA
  { from: { x: 190, y: 130 }, to: { x: 110, y: 85 }, color: "#eab308" }, // Africa -> NA
  { from: { x: 205, y: 75 }, to: { x: 320, y: 160 }, color: "#ec4899" }, // EU -> Oceania
];

interface FlightDot {
  id: number;
  corridor: number;
  progress: number;
}

export function WorldMapHero() {
  const [dots, setDots] = useState<FlightDot[]>([]);

  useEffect(() => {
    // Initialize dots
    const initialDots: FlightDot[] = corridors.map((_, i) => ({
      id: i,
      corridor: i,
      progress: Math.random(),
    }));
    setDots(initialDots);

    // Animate dots
    const interval = setInterval(() => {
      setDots((prev) =>
        prev.map((dot) => ({
          ...dot,
          progress: (dot.progress + 0.008) % 1,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getDotPosition = (corridorIndex: number, progress: number) => {
    const corridor = corridors[corridorIndex];
    return {
      x: corridor.from.x + (corridor.to.x - corridor.from.x) * progress,
      y: corridor.from.y + (corridor.to.y - corridor.from.y) * progress,
    };
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <svg
        viewBox="0 0 400 220"
        className="w-full h-auto"
        style={{ filter: "drop-shadow(4px 4px 0 #000)" }}
      >
        {/* Background */}
        <rect x="0" y="0" width="400" height="220" fill="#fef3c7" rx="8" />

        {/* Grid lines for retro effect */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 11}
            x2="400"
            y2={i * 11}
            stroke="#fcd34d"
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 10}
            y1="0"
            x2={i * 10}
            y2="220"
            stroke="#fcd34d"
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}

        {/* Corridor paths (dashed lines) */}
        {corridors.map((corridor, i) => (
          <path
            key={`path-${i}`}
            d={`M ${corridor.from.x} ${corridor.from.y} Q ${(corridor.from.x + corridor.to.x) / 2} ${Math.min(corridor.from.y, corridor.to.y) - 20} ${corridor.to.x} ${corridor.to.y}`}
            fill="none"
            stroke={corridor.color}
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.6"
          />
        ))}

        {/* Continents */}
        {Object.entries(regions).map(([name, path]) => (
          <path
            key={name}
            d={path}
            fill="#4ade80"
            stroke="#000"
            strokeWidth="2"
            className="transition-all hover:fill-green-400"
          />
        ))}

        {/* Animated flight dots */}
        {dots.map((dot) => {
          const pos = getDotPosition(dot.corridor, dot.progress);
          return (
            <g key={dot.id}>
              {/* Glow effect */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill={corridors[dot.corridor].color}
                opacity="0.3"
              />
              {/* Main dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="4"
                fill={corridors[dot.corridor].color}
                stroke="#000"
                strokeWidth="1"
              />
              {/* Plane icon (simplified) */}
              <text
                x={pos.x}
                y={pos.y + 1}
                fontSize="6"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                ✈
              </text>
            </g>
          );
        })}

        {/* Location markers */}
        <g className="location-markers">
          {/* Popular destinations */}
          <circle cx="110" cy="85" r="5" fill="#ef4444" stroke="#000" strokeWidth="2" />
          <circle cx="205" cy="75" r="5" fill="#3b82f6" stroke="#000" strokeWidth="2" />
          <circle cx="280" cy="80" r="4" fill="#8b5cf6" stroke="#000" strokeWidth="2" />
          <circle cx="190" cy="130" r="4" fill="#f97316" stroke="#000" strokeWidth="2" />
        </g>

        {/* Border */}
        <rect
          x="2"
          y="2"
          width="396"
          height="216"
          fill="none"
          stroke="#000"
          strokeWidth="4"
          rx="6"
        />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white border-2 border-black p-2 text-xs font-bold shadow-[2px_2px_0_0_#000]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Popular Destinations</span>
        </div>
      </div>
    </div>
  );
}
