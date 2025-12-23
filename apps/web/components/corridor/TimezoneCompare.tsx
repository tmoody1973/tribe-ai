"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

interface TimezoneCompareProps {
  originTimezone: string;
  destinationTimezone: string;
  originName: string;
  destinationName: string;
}

// Map common timezone abbreviations to IANA timezone names
function normalizeTimezone(tz: string): string {
  const tzMap: Record<string, string> = {
    "UTC+01:00": "Europe/Berlin",
    "UTC+00:00": "Europe/London",
    "UTC-05:00": "America/New_York",
    "UTC-08:00": "America/Los_Angeles",
    "UTC+05:30": "Asia/Kolkata",
    "UTC+08:00": "Asia/Singapore",
    "UTC+09:00": "Asia/Tokyo",
    "UTC-03:00": "America/Sao_Paulo",
    "UTC-04:00": "America/Toronto",
  };

  // If already a valid IANA timezone, return as-is
  if (tz.includes("/")) return tz;

  // Try to map UTC offset to IANA
  return tzMap[tz] ?? "UTC";
}

export function TimezoneCompare({
  originTimezone,
  destinationTimezone,
  originName,
  destinationName,
}: TimezoneCompareProps) {
  const t = useTranslations("stats.timezone");
  const [times, setTimes] = useState({ origin: "", destination: "" });
  const [hourDiff, setHourDiff] = useState(0);

  const normalizedOriginTz = normalizeTimezone(originTimezone);
  const normalizedDestTz = normalizeTimezone(destinationTimezone);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();

      try {
        const originTime = now.toLocaleTimeString("en-US", {
          timeZone: normalizedOriginTz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const destinationTime = now.toLocaleTimeString("en-US", {
          timeZone: normalizedDestTz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        setTimes({ origin: originTime, destination: destinationTime });

        // Calculate hour difference
        const originOffset = new Date(
          now.toLocaleString("en-US", { timeZone: normalizedOriginTz })
        );
        const destOffset = new Date(
          now.toLocaleString("en-US", { timeZone: normalizedDestTz })
        );
        const diffHours = Math.round(
          (destOffset.getTime() - originOffset.getTime()) / 3600000
        );
        setHourDiff(diffHours);
      } catch {
        // Fallback for invalid timezones
        setTimes({
          origin: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          destination: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        });
        setHourDiff(0);
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [normalizedOriginTz, normalizedDestTz]);

  const getDiffText = () => {
    if (hourDiff === 0) return t("sameTime");
    if (hourDiff > 0) return t("hoursAhead", { hours: hourDiff });
    return t("hoursBehind", { hours: Math.abs(hourDiff) });
  };

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <h3 className="text-lg font-bold mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
        <Clock size={20} />
        {t("title")}
      </h3>

      <div className="flex justify-between items-center">
        {/* Origin Time */}
        <div className="text-center flex-1">
          <p className="text-xs text-gray-500 mb-1">{originName}</p>
          <p className="text-3xl font-bold font-mono">{times.origin}</p>
          <p className="text-xs text-gray-400 mt-1">{originTimezone}</p>
        </div>

        {/* Difference Badge */}
        <div className="text-center px-4">
          <div
            className={`px-4 py-2 border-2 font-bold ${
              hourDiff === 0
                ? "bg-green-100 border-green-500 text-green-700"
                : "bg-yellow-100 border-yellow-500 text-yellow-800"
            }`}
          >
            {getDiffText()}
          </div>
        </div>

        {/* Destination Time */}
        <div className="text-center flex-1">
          <p className="text-xs text-gray-500 mb-1">{destinationName}</p>
          <p className="text-3xl font-bold font-mono">{times.destination}</p>
          <p className="text-xs text-gray-400 mt-1">{destinationTimezone}</p>
        </div>
      </div>

      {/* Helpful tip */}
      {hourDiff !== 0 && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          {hourDiff > 0
            ? t("tipAhead", { origin: originName, destination: destinationName })
            : t("tipBehind", { origin: originName, destination: destinationName })}
        </p>
      )}
    </div>
  );
}
