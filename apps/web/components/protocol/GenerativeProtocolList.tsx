"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProtocolList } from "./ProtocolList";
import { useTranslations } from "next-intl";

interface GenerativeProtocolListProps {
  corridorId: Id<"corridors">;
  stage: string;
}

/**
 * Protocol List Component
 *
 * Displays migration protocols from Convex.
 * Generative mode (CopilotKit actions) has been disabled to fix state patch errors.
 */
export function GenerativeProtocolList({ corridorId, stage }: GenerativeProtocolListProps) {
  const t = useTranslations("protocols");

  // Load protocols from Convex
  const protocols = useQuery(api.protocols.getProtocols, { corridorId });

  // Loading state
  if (!protocols) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  // Empty state
  if (protocols.length === 0) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <p className="text-gray-600">{t("noProtocols")}</p>
        <p className="text-sm text-gray-500 mt-2">
          Ask the chat assistant to help generate protocols for your journey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {protocols.length} {t("steps")} - {stage}
        </span>
      </div>
      <ProtocolList protocols={protocols as any} corridorId={corridorId} />
    </div>
  );
}
