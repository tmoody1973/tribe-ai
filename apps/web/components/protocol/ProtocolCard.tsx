"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronDown, ChevronUp, AlertTriangle, Lightbulb, Languages, Loader2, Bookmark, BookmarkCheck, LayoutGrid, Check } from "lucide-react";
import { Attribution, detectSourceType } from "./Attribution";
import { CommunityVerifiedBadge } from "./CommunityVerifiedBadge";
import { Confetti } from "./Confetti";
import { useTranslatedProtocol } from "@/hooks/useTranslatedProtocol";
import { StepAssistant } from "./StepAssistant";
import { DocumentChecklist } from "./DocumentChecklist";

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
  corridorId: Id<"corridors">;
  corridorOrigin?: string;
  corridorDestination?: string;
  isCurrent: boolean;
  isCompleted?: boolean;
  isArchived?: boolean; // For archive view
  onComplete?: (protocolId: Id<"protocols">) => void;
  onUncomplete?: (protocolId: Id<"protocols">) => void;
  onStatusChange?: (status: Status) => void;
  onRestore?: (protocolId: Id<"protocols">) => void; // For archive view
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
  protocol: originalProtocol,
  corridorId,
  corridorOrigin,
  corridorDestination,
  isCurrent,
  isCompleted: isCompletedProp,
  isArchived,
  onComplete,
  onUncomplete,
  onRestore,
}: ProtocolCardProps) {
  const [expanded, setExpanded] = useState(isCurrent);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToBoard, setIsAddingToBoard] = useState(false);
  const t = useTranslations("protocols");

  // Translate protocol content if needed
  const { protocol, isTranslating, isTranslated } = useTranslatedProtocol(originalProtocol);

  // Check if protocol is saved (bookmarked)
  const savedStatus = useQuery(api.protocolArchive.isProtocolSaved, {
    protocolId: protocol._id,
  });
  const isSaved = savedStatus?.isSaved ?? false;

  // Check if protocol already has a task on the board
  const existingTask = useQuery(api.tasks.getTaskForProtocolStep, {
    protocolStepId: protocol._id,
  });
  const isOnBoard = !!existingTask;

  // Save/unsave mutations
  const saveProtocol = useMutation(api.protocolArchive.saveProtocol);
  const unsaveProtocol = useMutation(api.protocolArchive.unsaveProtocol);
  const restoreProtocol = useMutation(api.protocolArchive.restoreProtocol);
  const createTaskFromProtocol = useMutation(api.tasks.createTaskFromProtocol);

  // Handle bookmark toggle
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      if (isSaved) {
        await unsaveProtocol({ protocolId: protocol._id });
      } else {
        await saveProtocol({ protocolId: protocol._id });
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle restore from archive
  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreProtocol({ protocolId: protocol._id });
      onRestore?.(protocol._id);
    } catch (error) {
      console.error("Failed to restore protocol:", error);
    }
  };

  // Handle adding to task board
  const handleAddToBoard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOnBoard || isAddingToBoard) return;

    setIsAddingToBoard(true);
    try {
      await createTaskFromProtocol({ protocolStepId: protocol._id });
    } catch (error) {
      console.error("Failed to add to board:", error);
    } finally {
      setIsAddingToBoard(false);
    }
  };

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
            {/* Translation indicator */}
            {isTranslating && (
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <Loader2 size={12} className="animate-spin" />
              </span>
            )}
            {isTranslated && !isTranslating && (
              <span className="text-gray-400" title="Translated">
                <Languages size={14} />
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Add to Board Button */}
          {!isArchived && (
            <button
              onClick={handleAddToBoard}
              disabled={isOnBoard || isAddingToBoard}
              className={`
                p-2 transition-colors rounded flex items-center gap-1
                ${isOnBoard
                  ? "text-cyan-600 bg-cyan-100 cursor-default"
                  : "text-gray-400 hover:text-cyan-600 hover:bg-cyan-50"
                }
                ${isAddingToBoard ? "opacity-50 cursor-not-allowed" : ""}
              `}
              title={isOnBoard ? t("onBoard") : t("addToBoard")}
            >
              {isAddingToBoard ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isOnBoard ? (
                <>
                  <Check size={14} />
                  <LayoutGrid size={16} />
                </>
              ) : (
                <LayoutGrid size={18} />
              )}
            </button>
          )}

          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkClick}
            disabled={isSaving}
            className={`
              p-2 transition-colors rounded
              ${isSaved
                ? "text-yellow-600 hover:text-yellow-700 bg-yellow-100"
                : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
              }
              ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
            `}
            title={isSaved ? t("unsaveProtocol") : t("saveProtocol")}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck size={18} />
            ) : (
              <Bookmark size={18} />
            )}
          </button>

          {/* Restore Button (Archive view only) */}
          {isArchived && (
            <button
              onClick={handleRestore}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors rounded"
              title={t("restoreProtocol")}
            >
              ↩️
            </button>
          )}

          {/* Expand Icon */}
          <button className="p-1">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
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

          {/* AI Step Assistant */}
          <div className="mt-4 pt-4 border-t-2 border-gray-300">
            <StepAssistant
              protocolId={protocol._id}
              corridorId={corridorId}
              stepTitle={protocol.title}
              stepDescription={protocol.description}
              stepCategory={protocol.category}
              stepPriority={protocol.priority}
              warnings={protocol.warnings}
              hacks={protocol.hacks}
            />
          </div>

          {/* Document Checklist */}
          {corridorOrigin && corridorDestination && (
            <DocumentChecklist
              protocolId={protocol._id}
              corridorId={corridorId}
              stepTitle={protocol.title}
              stepDescription={protocol.description}
              stepCategory={protocol.category}
              corridorOrigin={corridorOrigin}
              corridorDestination={corridorDestination}
            />
          )}
        </div>
      )}
    </div>
  );
}
