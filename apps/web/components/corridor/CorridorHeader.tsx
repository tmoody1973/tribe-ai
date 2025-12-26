"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { StageBadge } from "@/components/corridor/StageBadge";
import { JourneySwitcher } from "@/components/dashboard/JourneySwitcher";
import { RefreshCw } from "lucide-react";

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
  const router = useRouter();
  const locale = useLocale();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const forceRefresh = useMutation(api.corridors.forceRefreshProtocols);

  const handleRefreshProtocols = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await forceRefresh({ corridorId: corridor._id });
      // Refresh will trigger new research which Convex will handle reactively
    } catch (error) {
      console.error("Failed to refresh protocols:", error);
    } finally {
      // Keep showing spinner for a bit since research takes time
      setTimeout(() => setIsRefreshing(false), 3000);
    }
  };

  return (
    <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Journey Switcher + Corridor Route */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Journey Switcher Dropdown */}
          <JourneySwitcher onAddJourney={() => router.push(`/${locale}/onboarding`)} />

          {/* Current Journey Display */}
          <div className="flex items-center gap-3">
            <CountryFlag code={corridor.origin} size="lg" />
            <span className="text-2xl font-black">&rarr;</span>
            <CountryFlag code={corridor.destination} size="lg" />
            <div className="ml-2">
              <h1 className="text-2xl font-black">
                {corridor.name || t("yourJourney")}
              </h1>
              <p className="text-gray-600">
                {getCountryName(corridor.origin)} &rarr;{" "}
                {getCountryName(corridor.destination)}
              </p>
            </div>
          </div>

          {/* Refresh Protocols Button */}
          <button
            onClick={handleRefreshProtocols}
            disabled={isRefreshing}
            className={`p-2 border-2 border-black rounded transition-all ${
              isRefreshing
                ? "bg-gray-100 cursor-wait"
                : "bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            }`}
            title="Refresh protocols with latest research"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin text-gray-400" : "text-gray-600"}
            />
          </button>
        </div>

        {/* Stage Badge */}
        <StageBadge stage={corridor.stage} />
      </div>
    </div>
  );
}
