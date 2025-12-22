"use client";

import { useTranslations } from "next-intl";

const stageColors: Record<string, string> = {
  dreaming: "bg-purple-100 text-purple-800 border-purple-800",
  planning: "bg-blue-100 text-blue-800 border-blue-800",
  preparing: "bg-yellow-100 text-yellow-800 border-yellow-800",
  relocating: "bg-orange-100 text-orange-800 border-orange-800",
  settling: "bg-green-100 text-green-800 border-green-800",
};

interface StageBadgeProps {
  stage: string;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const t = useTranslations("onboarding.stages");

  return (
    <span
      className={`px-4 py-2 border-2 font-bold text-sm ${stageColors[stage] ?? "bg-gray-100 text-gray-800 border-gray-800"}`}
    >
      {t(`${stage}.title`)}
    </span>
  );
}
