"use client";

import { useTranslations } from "next-intl";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface EmptyStateProps {
  corridorId: Id<"corridors">;
}

export function EmptyState({ corridorId }: EmptyStateProps) {
  const t = useTranslations("dashboard.empty");
  const generateProtocols = useAction(api.ai.pipeline.generateCorridorProtocols);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger once per mount
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    // Trigger research if not already running
    generateProtocols({ corridorId }).catch((error) => {
      console.error("Failed to generate protocols:", error);
    });
  }, [corridorId, generateProtocols]);

  return (
    <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
      <div className="text-4xl mb-4 animate-bounce">🔍</div>
      <h3 className="text-xl font-bold mb-2">{t("title")}</h3>
      <p className="text-gray-600">{t("description")}</p>
      <p className="text-sm text-gray-500 mt-4">{t("estimatedTime")}</p>
    </div>
  );
}
