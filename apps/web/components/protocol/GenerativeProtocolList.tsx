"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCopilotChatSuggestions } from "@copilotkit/react-core";
import { useProtocolActions } from "@/hooks/useProtocolActions";
import { ProtocolList } from "./ProtocolList";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

interface GenerativeProtocolListProps {
  corridorId: Id<"corridors">;
  stage: string;
}

export function GenerativeProtocolList({ corridorId, stage }: GenerativeProtocolListProps) {
  const t = useTranslations("protocols");
  const [useGenerative, setUseGenerative] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasError, setHasError] = useState(false);

  // Register CopilotKit actions for generative rendering
  useProtocolActions(corridorId, stage);

  // Fallback: static protocols from Convex
  const staticProtocols = useQuery(api.protocols.getProtocols, { corridorId });

  // Add chat suggestions for protocol generation
  useCopilotChatSuggestions({
    instructions: "Suggest asking about specific protocol steps or requesting personalized advice for migration",
    minSuggestions: 2,
    maxSuggestions: 4,
  });

  // Fallback on error
  useEffect(() => {
    if (hasError && staticProtocols) {
      setUseGenerative(false);
    }
  }, [hasError, staticProtocols]);

  // If generative mode is off, use static rendering
  if (!useGenerative && staticProtocols) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">{t("staticMode")}</span>
          <button
            onClick={() => setUseGenerative(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            {t("switchToGenerative")}
          </button>
        </div>
        <ProtocolList protocols={staticProtocols} corridorId={corridorId} />
      </div>
    );
  }

  // If no static protocols available yet, show loading
  if (!staticProtocols) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  // Generative mode with static fallback
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {t("generativeMode")}
        </span>
        <button
          onClick={() => setUseGenerative(false)}
          className="text-sm text-blue-600 hover:underline"
        >
          {t("switchToStatic")}
        </button>
      </div>

      {/* Show static protocols as base, CopilotKit will enhance with actions */}
      <ProtocolList protocols={staticProtocols} corridorId={corridorId} />

      {/* CopilotKit will inject additional generated cards via action renders */}
      <div id="generative-protocols" className="space-y-4">
        {/* Cards appear here when agent calls showProtocolCard */}
      </div>
    </div>
  );
}
