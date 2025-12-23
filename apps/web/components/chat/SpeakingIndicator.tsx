"use client";

import { useTranslations } from "next-intl";

interface SpeakingIndicatorProps {
  className?: string;
}

export function SpeakingIndicator({ className = "" }: SpeakingIndicatorProps) {
  const t = useTranslations("chat.voice");

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold border-2 border-black ${className}`}
    >
      {/* Animated waveform bars */}
      <div className="flex items-center gap-0.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: `${8 + (i % 2) * 4}px`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <span>{t("speaking")}</span>
    </div>
  );
}
