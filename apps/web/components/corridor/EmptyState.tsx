"use client";

import { useTranslations } from "next-intl";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface EmptyStateProps {
  corridorId: Id<"corridors">;
}

export function EmptyState({ corridorId }: EmptyStateProps) {
  const t = useTranslations("dashboard.empty");
  const generateProtocols = useAction(api.ai.pipeline.generateCorridorProtocols);
  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });
  const hasTriggered = useRef(false);
  const corridorIdRef = useRef(corridorId);

  useEffect(() => {
    // Reset trigger if corridorId changes
    if (corridorIdRef.current !== corridorId) {
      hasTriggered.current = false;
      corridorIdRef.current = corridorId;
    }

    // Only trigger once per corridorId, and only if not already refreshing
    if (hasTriggered.current) return;
    if (corridor?.researchStatus === "refreshing") {
      console.log("Already refreshing, skipping trigger");
      return;
    }

    hasTriggered.current = true;

    // Trigger research if not already running
    generateProtocols({ corridorId }).catch((error) => {
      console.error("Failed to generate protocols:", error);
      // Reset on error to allow retry
      hasTriggered.current = false;
    });
  }, [corridorId, corridor?.researchStatus, generateProtocols]);

  const isRefreshing = corridor?.researchStatus === "refreshing";
  const hasError = corridor?.researchStatus === "error";

  return (
    <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
      <div className="text-4xl mb-4 animate-bounce">🔍</div>
      <h3 className="text-xl font-bold mb-2">{t("title")}</h3>
      <p className="text-gray-600">{t("description")}</p>
      {isRefreshing && (
        <p className="text-sm text-blue-600 mt-4 animate-pulse">
          Researching your corridor...
        </p>
      )}
      {hasError && corridor?.errorMessage && (
        <p className="text-sm text-red-600 mt-4">
          Error: {corridor.errorMessage}
        </p>
      )}
      {!isRefreshing && !hasError && (
        <p className="text-sm text-gray-500 mt-4">{t("estimatedTime")}</p>
      )}
    </div>
  );
}
