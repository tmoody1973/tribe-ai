"use client";

import { useTranslations } from "next-intl";
import { migrationStages, type MigrationStage } from "@/lib/constants/stages";

interface StageSelectorProps {
  value: MigrationStage | "";
  onChange: (stage: MigrationStage) => void;
}

export function StageSelector({ value, onChange }: StageSelectorProps) {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      {migrationStages.map((stage) => (
        <button
          key={stage.id}
          type="button"
          onClick={() => onChange(stage.id)}
          className={`w-full border-4 border-black p-4 text-left transition-all ${
            value === stage.id
              ? "bg-black text-white"
              : "bg-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
          }`}
        >
          <div className="font-bold text-lg">{t(stage.labelKey)}</div>
          <div className={`text-sm ${value === stage.id ? "text-gray-300" : "text-gray-600"}`}>
            {t(stage.descriptionKey)}
          </div>
        </button>
      ))}
    </div>
  );
}
