"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map to avoid SSR issues with Mapbox
const InteractiveGlobeMap = dynamic(
  () => import("./InteractiveGlobeMap").then((mod) => mod.InteractiveGlobeMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-lg border-4 border-black shadow-[8px_8px_0_0_#000] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-bold">Loading Globe...</p>
        </div>
      </div>
    ),
  }
);

// Import CORRIDORS from the map component for consistency
const CORRIDORS = [
  {
    id: "mx-us",
    from: { code: "MX", name: "Mexico", flag: "🇲🇽" },
    to: { code: "US", name: "United States", flag: "🇺🇸" },
    migrants: "11M+",
    trend: "stable" as const,
    color: "#ef4444",
  },
  {
    id: "in-us",
    from: { code: "IN", name: "India", flag: "🇮🇳" },
    to: { code: "US", name: "United States", flag: "🇺🇸" },
    migrants: "2.7M+",
    trend: "up" as const,
    color: "#f97316",
  },
  {
    id: "ng-uk",
    from: { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    to: { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
    migrants: "250K+",
    trend: "up" as const,
    color: "#22c55e",
  },
  {
    id: "ph-ca",
    from: { code: "PH", name: "Philippines", flag: "🇵🇭" },
    to: { code: "CA", name: "Canada", flag: "🇨🇦" },
    migrants: "900K+",
    trend: "up" as const,
    color: "#3b82f6",
  },
  {
    id: "br-pt",
    from: { code: "BR", name: "Brazil", flag: "🇧🇷" },
    to: { code: "PT", name: "Portugal", flag: "🇵🇹" },
    migrants: "200K+",
    trend: "up" as const,
    color: "#eab308",
  },
  {
    id: "cn-au",
    from: { code: "CN", name: "China", flag: "🇨🇳" },
    to: { code: "AU", name: "Australia", flag: "🇦🇺" },
    migrants: "650K+",
    trend: "stable" as const,
    color: "#8b5cf6",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const mapVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
    },
  },
};

interface CorridorsMapSectionProps {
  title: string;
  subtitle: string;
}

export function CorridorsMapSection({ title, subtitle }: CorridorsMapSectionProps) {
  const [hoveredCorridor, setHoveredCorridor] = useState<string | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-head text-4xl md:text-5xl mb-4 text-white">{title}</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        {/* Interactive globe map */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          variants={mapVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <InteractiveGlobeMap
            hoveredCorridor={hoveredCorridor}
            onCorridorHover={setHoveredCorridor}
          />

          {/* Corridor cards */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {CORRIDORS.map((corridor) => (
              <motion.div
                key={corridor.id}
                variants={itemVariants}
                className={`
                  bg-white border-3 border-black p-3
                  shadow-[3px_3px_0_0_#000]
                  hover:shadow-[1px_1px_0_0_#000]
                  hover:translate-x-[2px] hover:translate-y-[2px]
                  transition-all duration-200 cursor-pointer
                  ${hoveredCorridor === corridor.id ? "ring-2 ring-offset-2 scale-105" : ""}
                `}
                style={{
                  borderLeftColor: corridor.color,
                  borderLeftWidth: "6px",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": corridor.color,
                }}
                onMouseEnter={() => setHoveredCorridor(corridor.id)}
                onMouseLeave={() => setHoveredCorridor(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-400 text-sm">
            Hover over corridors to explore • Globe rotates automatically
          </p>
        </motion.div>
      </div>
    </section>
  );
}
