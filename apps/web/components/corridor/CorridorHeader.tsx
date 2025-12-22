"use client";

import { useTranslations } from "next-intl";
import { Doc } from "@/convex/_generated/dataModel";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { StageBadge } from "@/components/corridor/StageBadge";

interface CorridorHeaderProps {
  corridor: Doc<"corridors">;
}

function getCountryName(code: string, locale: string = "en"): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function CorridorHeader({ corridor }: CorridorHeaderProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Corridor Route */}
        <div className="flex items-center gap-3">
          <CountryFlag code={corridor.origin} size="lg" />
          <span className="text-2xl font-black">&rarr;</span>
          <CountryFlag code={corridor.destination} size="lg" />
          <div className="ml-2">
            <h1 className="text-2xl font-black">{t("yourJourney")}</h1>
            <p className="text-gray-600">
              {getCountryName(corridor.origin)} &rarr;{" "}
              {getCountryName(corridor.destination)}
            </p>
          </div>
        </div>

        {/* Stage Badge */}
        <StageBadge stage={corridor.stage} />
      </div>
    </div>
  );
}
