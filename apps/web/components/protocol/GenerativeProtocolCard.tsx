"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle, Lightbulb, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface GeneratedProtocol {
  category: string;
  title: string;
  description: string;
  priority: string;
  order: number;
  warnings?: string[];
  hacks?: string[];
  confidence?: number;
  attribution?: {
    sourceUrl: string;
    authorName?: string;
    engagement?: number;
  };
}

interface GenerativeProtocolCardProps {
  protocol: GeneratedProtocol;
  emphasis: "high" | "medium" | "low";
  isStreaming?: boolean;
}

const categoryColors: Record<string, string> = {
  visa: "border-l-purple-500 bg-purple-50",
  finance: "border-l-green-500 bg-green-50",
  housing: "border-l-blue-500 bg-blue-50",
  employment: "border-l-orange-500 bg-orange-50",
  legal: "border-l-red-500 bg-red-50",
  health: "border-l-pink-500 bg-pink-50",
  social: "border-l-cyan-500 bg-cyan-50",
};

const categoryIcons: Record<string, string> = {
  visa: "🛂",
  finance: "💰",
  housing: "🏠",
  employment: "💼",
  legal: "⚖️",
  health: "🏥",
  social: "👥",
};

const emphasisStyles: Record<string, string> = {
  high: "ring-2 ring-yellow-400 ring-offset-2",
  medium: "",
  low: "opacity-75",
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-400 text-black",
  low: "bg-gray-300 text-black",
};

export function GenerativeProtocolCard({
  protocol,
  emphasis,
  isStreaming = false,
}: GenerativeProtocolCardProps) {
  const [expanded, setExpanded] = useState(emphasis === "high");
  const t = useTranslations("protocols");

  const hasWarnings = protocol.warnings && protocol.warnings.length > 0;
  const hasHacks = protocol.hacks && protocol.hacks.length > 0;
  const isLowConfidence = protocol.confidence !== undefined && protocol.confidence < 0.7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        border-4 border-black border-l-8 shadow-[4px_4px_0_0_#000]
        transition-all duration-200
        ${categoryColors[protocol.category] ?? "bg-white"}
        ${emphasisStyles[emphasis]}
        ${isLowConfidence ? "border-dashed" : ""}
        ${isStreaming ? "animate-pulse" : ""}
      `}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Step Number */}
        <div className="w-10 h-10 flex items-center justify-center border-2 border-black font-bold text-lg bg-white flex-shrink-0">
          {protocol.order}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span>{categoryIcons[protocol.category] ?? "📋"}</span>
            <span className="text-xs font-bold uppercase text-gray-500">
              {t(`categories.${protocol.category}`)}
            </span>
            {emphasis === "high" && (
              <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5">
                {t("recommended")}
              </span>
            )}
            {isLowConfidence && (
              <span className="text-orange-600" title="Lower confidence - verify this information">
                <HelpCircle size={14} />
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg">{protocol.title}</h3>
          {!expanded && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {protocol.description}
            </p>
          )}
        </div>

        {/* Expand Icon */}
        <button className="p-1 flex-shrink-0">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t-2 border-black pt-4">
          <p className="text-gray-700 mb-4">{protocol.description}</p>

          {/* Low Confidence Warning */}
          {isLowConfidence && (
            <div className="bg-orange-100 border-2 border-orange-400 p-3 mb-3">
              <div className="flex items-center gap-2 text-orange-700 text-sm">
                <HelpCircle size={16} />
                <span>{t("lowConfidenceWarning")}</span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="bg-red-100 border-2 border-red-500 p-3 mb-3">
              <div className="flex items-center gap-2 font-bold text-red-700 mb-2">
                <AlertTriangle size={18} />
                {t("warnings")}
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {protocol.warnings!.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hacks/Tips */}
          {hasHacks && (
            <div className="bg-green-100 border-2 border-green-500 p-3 mb-3">
              <div className="flex items-center gap-2 font-bold text-green-700 mb-2">
                <Lightbulb size={18} />
                {t("tips")}
              </div>
              <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                {protocol.hacks!.map((hack, i) => (
                  <li key={i}>{hack}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Priority Badge & Confidence */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <span className={`px-2 py-1 text-xs font-bold ${priorityColors[protocol.priority] ?? priorityColors.medium}`}>
              {t(`priorities.${protocol.priority}`)}
            </span>
            {protocol.confidence !== undefined && (
              <span className="text-xs text-gray-500">
                {t("confidence")}: {Math.round(protocol.confidence * 100)}%
              </span>
            )}
          </div>

          {/* Attribution */}
          {protocol.attribution && (
            <div className="mt-4 pt-4 border-t-2 border-gray-300 text-sm text-gray-600">
              <a
                href={protocol.attribution.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-blue-600"
              >
                {protocol.attribution.authorName ?? "Source"}
              </a>
              {protocol.attribution.engagement && (
                <span className="ml-2">
                  • {protocol.attribution.engagement} confirmations
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
