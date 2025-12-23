"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface RecordingIndicatorProps {
  startTime: number;
}

export function RecordingIndicator({ startTime }: RecordingIndicatorProps) {
  const t = useTranslations("chat.voice");
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-500 text-white border-4 border-black shadow-[4px_4px_0_0_#000] whitespace-nowrap">
      {/* Waveform Animation */}
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: `${8 + Math.sin(Date.now() / 200 + i) * 6}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className="font-mono font-bold">{formatDuration(duration)}</span>

      {/* Label */}
      <span className="text-xs">{t("recording")}</span>
    </div>
  );
}
