"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Id } from "@/convex/_generated/dataModel";
import { Archive, ChevronDown, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { ProtocolCard } from "./ProtocolCard";

interface Protocol {
  _id: Id<"protocols">;
  category: "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  priority: "critical" | "high" | "medium" | "low";
  warnings?: string[];
  hacks?: string[];
  attribution?: {
    authorName?: string;
    sourceUrl: string;
    sourceDate?: number;
    engagement?: number;
  };
  order: number;
  generatedForStage?: string;
  archived?: boolean;
  archivedAt?: number;
}

interface ArchivedData {
  byStage: Record<string, Protocol[]>;
  totalArchived: number;
  stages: string[];
}

interface ProtocolArchiveViewProps {
  archivedData: ArchivedData | undefined | null;
  corridorId: Id<"corridors">;
}

const stageEmojis: Record<string, string> = {
  dreaming: "💭",
  planning: "📋",
  preparing: "📦",
  relocating: "✈️",
  settling: "🏡",
  unknown: "📁",
};

const stageOrder = ["dreaming", "planning", "preparing", "relocating", "settling"];

export function ProtocolArchiveView({ archivedData, corridorId }: ProtocolArchiveViewProps) {
  const t = useTranslations("protocols");
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Empty state
  if (!archivedData || archivedData.totalArchived === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 border-4 border-black flex items-center justify-center">
          <Archive size={32} className="text-gray-400" />
        </div>
        <h3 className="font-bold text-lg mb-2">{t("archive.empty")}</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {t("archive.emptyDescription")}
        </p>
      </div>
    );
  }

  const toggleStage = (stage: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  // Sort stages by journey order
  const sortedStages = [...archivedData.stages].sort((a, b) => {
    const aIndex = stageOrder.indexOf(a);
    const bIndex = stageOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <div className="space-y-4">
      {/* Archive Header */}
      <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
        <Archive size={20} className="text-gray-500" />
        <h3 className="font-bold">{t("archive.title")}</h3>
        <span className="text-sm text-gray-500">
          ({archivedData.totalArchived} {t("completed").toLowerCase()})
        </span>
      </div>

      {/* Stage Accordion */}
      {sortedStages.map((stage) => {
        const protocols = archivedData.byStage[stage] || [];
        const completedCount = protocols.filter((p) => p.status === "completed").length;
        const isExpanded = expandedStages.has(stage);

        return (
          <div
            key={stage}
            className="border-2 border-black bg-gray-50 overflow-hidden"
          >
            {/* Stage Header */}
            <button
              onClick={() => toggleStage(stage)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stageEmojis[stage] || "📁"}</span>
                <div className="text-left">
                  <h4 className="font-bold capitalize">{stage}</h4>
                  <p className="text-sm text-gray-600">
                    {protocols.length} protocols • {completedCount} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Completion indicator */}
                <div className="flex items-center gap-1">
                  {completedCount === protocols.length ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <div className="w-16 h-2 bg-gray-200 border border-black">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(completedCount / protocols.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </div>
            </button>

            {/* Expanded Protocols */}
            {isExpanded && (
              <div className="border-t-2 border-black p-4 space-y-3 bg-white">
                {protocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol._id}
                    protocol={protocol}
                    corridorId={corridorId}
                    isCurrent={false}
                    isCompleted={protocol.status === "completed"}
                    isArchived={true}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Timeline hint */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <Clock size={14} className="inline mr-1" />
        Your journey history is preserved here for reference
      </div>
    </div>
  );
}
