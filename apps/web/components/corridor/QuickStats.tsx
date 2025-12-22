"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";

interface QuickStatsProps {
  corridorId: Id<"corridors">;
}

interface CorridorBaseline {
  origin?: {
    name?: string;
    languages?: string[];
    currencies?: Array<{ code: string; name: string }>;
    timezone?: string;
  };
  destination?: {
    name?: string;
    languages?: string[];
    currencies?: Array<{ code: string; name: string }>;
    timezone?: string;
  };
  visa?: {
    visaRequired?: boolean;
    visaType?: string;
  };
}

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

export function QuickStats({ corridorId }: QuickStatsProps) {
  const t = useTranslations("dashboard.stats");
  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });
  const [baseline, setBaseline] = useState<CorridorBaseline | null>(null);
  const [loading, setLoading] = useState(true);

  const getBaseline = useAction(api.corridorData.getCorridorBaseline);

  useEffect(() => {
    if (!corridor) return;

    setLoading(true);
    getBaseline({
      origin: corridor.origin,
      destination: corridor.destination,
    })
      .then((data) => {
        setBaseline(data as CorridorBaseline);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [corridor, getBaseline]);

  if (!corridor) return null;

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <h3 className="text-lg font-bold mb-4 border-b-2 border-black pb-2">
        {t("title")}
      </h3>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visa Status */}
          <StatItem
            label={t("visaRequired")}
            value={baseline?.visa?.visaRequired ? t("yes") : t("no")}
            icon="🛂"
          />

          {/* Visa Type */}
          {baseline?.visa?.visaType && (
            <StatItem
              label={t("visaType")}
              value={baseline.visa.visaType}
              icon="📋"
            />
          )}

          {/* Language */}
          <StatItem
            label={t("language")}
            value={baseline?.destination?.languages?.[0] ?? "—"}
            icon="🗣️"
          />

          {/* Currency */}
          <StatItem
            label={t("currency")}
            value={baseline?.destination?.currencies?.[0]?.code ?? "—"}
            icon="💰"
          />

          {/* Timezone */}
          <StatItem
            label={t("timezone")}
            value={baseline?.destination?.timezone ?? "—"}
            icon="🕐"
          />
        </div>
      )}
    </div>
  );
}
