"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronDown, ChevronUp, AlertTriangle, Lightbulb } from "lucide-react";
import { Attribution, detectSourceType } from "./Attribution";
import { CommunityVerifiedBadge } from "./CommunityVerifiedBadge";
import { Confetti } from "./Confetti";

type Category = "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
type Priority = "critical" | "high" | "medium" | "low";
type Status = "not_started" | "in_progress" | "completed" | "blocked";

interface AttributionData {
  authorName?: string;
  sourceUrl: string;
  sourceDate?: number;
  engagement?: number;
}

interface Protocol {
  _id: Id<"protocols">;
  category: Category;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  warnings?: string[];
  hacks?: string[];
  attribution?: AttributionData;
  order: number;
}

interface ProtocolCardProps {
  protocol: Protocol;
  isCurrent: boolean;
  isCompleted?: boolean;
  onComplete?: (protocolId: Id<"protocols">) => void;
  onUncomplete?: (protocolId: Id<"protocols">) => void;
  onStatusChange?: (status: Status) => void;
}

const categoryColors: Record<Category, string> = {
  visa: "border-l-purple-500 bg-purple-50",
  finance: "border-l-green-500 bg-green-50",
  housing: "border-l-blue-500 bg-blue-50",
  employment: "border-l-orange-500 bg-orange-50",
  legal: "border-l-red-500 bg-red-50",
  health: "border-l-pink-500 bg-pink-50",
  social: "border-l-cyan-500 bg-cyan-50",
};

const categoryIcons: Record<Category, string> = {
  visa: "🛂",
  finance: "💰",
  housing: "🏠",
  employment: "💼",
  legal: "⚖️",
  health: "🏥",
  social: "👥",
};

const priorityColors: Record<Priority, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-400 text-black",
  low: "bg-gray-300 text-black",
};

export function ProtocolCard({
  protocol,
  isCurrent,
  isCompleted: isCompletedProp,
  onComplete,
  onUncomplete,
}: ProtocolCardProps) {
  const [expanded, setExpanded] = useState(isCurrent);
  const [showConfetti, setShowConfetti] = useState(false);
  const t = useTranslations("protocols");

  // Use prop if provided, otherwise fall back to status field
  const isCompleted = isCompletedProp ?? protocol.status === "completed";
  const hasWarnings = protocol.warnings && protocol.warnings.length > 0;
  const hasHacks = protocol.hacks && protocol.hacks.length > 0;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      onUncomplete?.(protocol._id);
    } else {
      onComplete?.(protocol._id);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  return (
    <div
      className={`
        relative
        border-4 border-black border-l-8 shadow-[4px_4px_0_0_#000]
        transition-all duration-200
        ${categoryColors[protocol.category] ?? "bg-white"}
        ${isCurrent ? "ring-4 ring-yellow-400 ring-offset-2" : ""}
        ${isCompleted ? "opacity-60" : ""}
      `}
    >
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Completion Checkbox / Step Number */}
        <button
          onClick={handleCheckboxClick}
          className={`
            w-10 h-10 flex items-center justify-center flex-shrink-0
            border-2 border-black font-bold text-lg
            transition-colors hover:scale-105
            ${isCompleted ? "bg-green-500 text-white" : "bg-white hover:bg-gray-100"}
          `}
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted ? "✓" : protocol.order}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span>{categoryIcons[protocol.category]}</span>
            <span className="text-xs font-bold uppercase text-gray-500">
              {t(`categories.${protocol.category}`)}
            </span>
            {isCurrent && (
              <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5">
                {t("currentStep")}
              </span>
            )}
          </div>
          <h3 className={`font-bold text-lg ${isCompleted ? "line-through" : ""}`}>
            {protocol.title}
          </h3>
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
          {/* Full Description */}
          <p className="text-gray-700 mb-4">{protocol.description}</p>

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

          {/* Priority Badge & Attribution */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <span
              className={`px-2 py-1 text-xs font-bold ${priorityColors[protocol.priority]}`}
            >
              {t(`priorities.${protocol.priority}`)}
            </span>
            {protocol.attribution && (
              <CommunityVerifiedBadge engagement={protocol.attribution.engagement} />
            )}
          </div>

          {/* Attribution Section */}
          {protocol.attribution && (
            <div className="mt-4 pt-4 border-t-2 border-gray-300">
              <Attribution
                attribution={protocol.attribution}
                source={detectSourceType(protocol.attribution.sourceUrl)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
