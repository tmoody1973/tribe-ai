"use client";

import { useTranslations } from "next-intl";

interface BriefingTypeSelectorProps {
  selected: "daily" | "weekly";
  onChange: (type: "daily" | "weekly") => void;
}

export function BriefingTypeSelector({
  selected,
  onChange,
}: BriefingTypeSelectorProps) {
  const t = useTranslations("briefing.types");

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("daily")}
        className={`
          flex-1 py-3 px-4 border-4 border-black font-bold transition-colors
          ${selected === "daily" ? "bg-black text-white" : "bg-white hover:bg-gray-100"}
        `}
      >
        <div>{t("daily")}</div>
        <div className="text-xs font-normal opacity-75">{t("dailyDuration")}</div>
      </button>
      <button
        onClick={() => onChange("weekly")}
        className={`
          flex-1 py-3 px-4 border-4 border-black font-bold transition-colors
          ${selected === "weekly" ? "bg-black text-white" : "bg-white hover:bg-gray-100"}
        `}
      >
        <div>{t("weekly")}</div>
        <div className="text-xs font-normal opacity-75">{t("weeklyDuration")}</div>
      </button>
    </div>
  );
}
