"use client";

import { useTranslations } from "next-intl";

interface SpeedSelectorProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

export function SpeedSelector({ currentSpeed, onSpeedChange }: SpeedSelectorProps) {
  const t = useTranslations("briefing");

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm text-gray-600 mr-2">{t("speed")}:</span>
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          onClick={() => onSpeedChange(speed)}
          className={`
            px-3 py-1 border-2 border-black font-bold text-sm transition-colors
            ${currentSpeed === speed ? "bg-black text-white" : "bg-white hover:bg-gray-100"}
          `}
        >
          {speed}x
        </button>
      ))}
    </div>
  );
}
