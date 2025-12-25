"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProtocolCard } from "./ProtocolCard";
import { ProgressBar } from "./ProgressBar";
import { VoiceStepWalkthrough } from "./VoiceStepWalkthrough";

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

interface ProtocolListProps {
  protocols: Protocol[];
  corridorId: Id<"corridors">;
}

export function ProtocolList({ protocols, corridorId }: ProtocolListProps) {
  const t = useTranslations("protocols");

  // Fetch corridor details for progress display
  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });

  // Fetch user progress
  const progress = useQuery(api.progress.getProgress, { corridorId });
  const markComplete = useMutation(api.progress.markComplete);
  const markIncomplete = useMutation(api.progress.markIncomplete);

  // Create set of completed protocol IDs
  const completedIds = new Set(progress?.map((p: { protocolId: Id<"protocols"> }) => p.protocolId) ?? []);
  const completedCount = completedIds.size;

  // Sort: incomplete first (by order), then completed (by order)
  const sorted = [...protocols].sort((a, b) => {
    const aComplete = completedIds.has(a._id);
    const bComplete = completedIds.has(b._id);
    if (aComplete !== bComplete) return aComplete ? 1 : -1;
    return a.order - b.order;
  });

  // Find current step (first incomplete)
  const currentProtocol = sorted.find((p) => !completedIds.has(p._id));

  const handleComplete = async (protocolId: Id<"protocols">) => {
    await markComplete({ protocolId, corridorId });
  };

  const handleUncomplete = async (protocolId: Id<"protocols">) => {
    await markIncomplete({ protocolId });
  };

  if (sorted.length === 0) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <p className="text-gray-600">{t("noProtocols")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <ProgressBar
        completed={completedCount}
        total={protocols.length}
        corridorOrigin={corridor?.origin}
        corridorDestination={corridor?.destination}
      />

      {/* Voice Walkthrough Button */}
      {currentProtocol && (
        <VoiceStepWalkthrough
          stepTitle={currentProtocol.title}
          stepDescription={currentProtocol.description}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("yourProtocol")}</h2>
        <span className="text-sm text-gray-600">
          Click the step number to mark complete
        </span>
      </div>

      {/* Protocol Cards with Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-7 top-5 bottom-5 w-1 bg-black -z-10" />

        {/* Cards */}
        <div className="space-y-4 relative">
          {sorted.map((protocol) => (
            <ProtocolCard
              key={protocol._id}
              protocol={protocol}
              corridorId={corridorId}
              isCurrent={protocol._id === currentProtocol?._id}
              isCompleted={completedIds.has(protocol._id)}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
