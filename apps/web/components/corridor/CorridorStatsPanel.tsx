"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { CostComparisonPanel } from "./CostComparisonPanel";
import { CurrencyConverter } from "./CurrencyConverter";
import { TimezoneCompare } from "./TimezoneCompare";
import { StatsLoadingSkeleton } from "./StatsLoadingSkeleton";
import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

interface CorridorStatsPanelProps {
  corridorId: Id<"corridors">;
}

interface CorridorBaseline {
  origin: {
    name: string;
    officialName: string;
    capital: string;
    currencies: { code: string; name: string; symbol: string }[];
    languages: string[];
    timezone: string;
    flagUrl: string;
    region: string;
    population: number;
  } | null;
  destination: {
    name: string;
    officialName: string;
    capital: string;
    currencies: { code: string; name: string; symbol: string }[];
    languages: string[];
    timezone: string;
    flagUrl: string;
    region: string;
    population: number;
  } | null;
  visa: {
    visaRequired: boolean;
    visaType: string | null;
    stayDuration: number | null;
    requirements: string[];
    processingTime: string | null;
    eVisaAvailable: boolean;
    eVisaLink: string | null;
  } | null;
  costComparison: {
    originCity: string;
    destinationCity: string;
    rentIndex: number;
    groceriesIndex: number;
    transportIndex: number;
    utilitiesIndex: number;
    overallIndex: number;
    difference: number;
    stale?: boolean;
  } | null;
  fetchedAt: number;
  errors: string[];
}

export function CorridorStatsPanel({ corridorId }: CorridorStatsPanelProps) {
  const t = useTranslations("stats");
  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });
  const [baseline, setBaseline] = useState<CorridorBaseline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getBaseline = useAction(api.corridorData.getCorridorBaseline);

  useEffect(() => {
    if (corridor) {
      setIsLoading(true);
      setError(null);
      getBaseline({
        origin: corridor.origin,
        destination: corridor.destination,
      })
        .then((data) => setBaseline(data as CorridorBaseline))
        .catch((err) => {
          console.error("Failed to fetch baseline:", err);
          setError("Failed to load corridor statistics");
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corridor?.origin, corridor?.destination, getBaseline]);

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }

  if (error || !baseline) {
    return (
      <div className="border-4 border-red-500 bg-red-50 p-4 shadow-[4px_4px_0_0_#ef4444]">
        <p className="text-red-700 flex items-center gap-2">
          <AlertTriangle size={20} />
          {error ?? t("loadError")}
        </p>
      </div>
    );
  }

  const originCurrency = baseline.origin?.currencies?.[0] ?? {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  };
  const destCurrency = baseline.destination?.currencies?.[0] ?? {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  };

  return (
    <div className="space-y-6">
      {/* Visa Information */}
      <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
        <h3 className="text-lg font-bold mb-4 border-b-2 border-black pb-2">
          {t("visaInfo")}
        </h3>

        <div className="space-y-3">
          {/* Visa Required Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-2">
              <span>🛂</span>
              {t("visaRequired")}
            </span>
            <span
              className={`font-bold flex items-center gap-1 ${
                baseline.visa?.visaRequired ? "text-red-600" : "text-green-600"
              }`}
            >
              {baseline.visa?.visaRequired ? (
                <>
                  <AlertTriangle size={16} />
                  {t("yes")}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t("no")}
                </>
              )}
            </span>
          </div>

          {/* Visa Type */}
          {baseline.visa?.visaType && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <span>📋</span>
                {t("visaType")}
              </span>
              <span className="font-bold">{baseline.visa.visaType}</span>
            </div>
          )}

          {/* Processing Time */}
          {baseline.visa?.processingTime && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <span>⏱️</span>
                {t("processingTime")}
              </span>
              <span className="font-bold">{baseline.visa.processingTime}</span>
            </div>
          )}

          {/* Stay Duration */}
          {baseline.visa?.stayDuration && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <span>📅</span>
                {t("stayDuration")}
              </span>
              <span className="font-bold">
                {baseline.visa.stayDuration} {t("days")}
              </span>
            </div>
          )}

          {/* e-Visa Available */}
          {baseline.visa?.eVisaAvailable && (
            <div className="mt-3 p-3 bg-green-50 border-2 border-green-500">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-bold flex items-center gap-2">
                  <CheckCircle size={16} />
                  {t("eVisaAvailable")}
                </span>
                {baseline.visa.eVisaLink && (
                  <a
                    href={baseline.visa.eVisaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 underline flex items-center gap-1"
                  >
                    {t("apply")} <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Requirements */}
          {baseline.visa?.requirements && baseline.visa.requirements.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-bold text-gray-600 mb-2">{t("requirements")}:</p>
              <ul className="text-sm space-y-1">
                {baseline.visa.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Cost Comparison */}
      {baseline.costComparison && (
        <CostComparisonPanel
          costs={baseline.costComparison}
          originName={baseline.origin?.name ?? corridor?.origin ?? ""}
          destinationName={baseline.destination?.name ?? corridor?.destination ?? ""}
          originCurrency={originCurrency}
          destinationCurrency={destCurrency}
        />
      )}

      {/* Currency Conversion */}
      <CurrencyConverter
        originCurrency={originCurrency}
        destinationCurrency={destCurrency}
      />

      {/* Timezone Comparison */}
      {baseline.origin?.timezone && baseline.destination?.timezone && (
        <TimezoneCompare
          originTimezone={baseline.origin.timezone}
          destinationTimezone={baseline.destination.timezone}
          originName={baseline.origin.name}
          destinationName={baseline.destination.name}
        />
      )}

      {/* Language */}
      <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
        <h3 className="text-lg font-bold mb-4 border-b-2 border-black pb-2">
          {t("language")}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <span>🗣️</span>
            {t("primaryLanguage")}
          </span>
          <span className="font-bold">
            {baseline.destination?.languages?.[0] ?? "—"}
          </span>
        </div>

        {baseline.destination?.languages &&
          baseline.destination.languages.length > 1 && (
            <p className="text-sm text-gray-500 mt-2">
              {t("otherLanguages")}:{" "}
              {baseline.destination.languages.slice(1).join(", ")}
            </p>
          )}
      </div>

      {/* Errors Warning */}
      {baseline.errors && baseline.errors.length > 0 && (
        <div className="border-2 border-orange-400 bg-orange-50 p-3 text-sm text-orange-700">
          <p className="font-bold flex items-center gap-2">
            <AlertTriangle size={16} />
            {t("partialData")}
          </p>
          <p className="mt-1 text-xs">
            {t("someDataMissing")}
          </p>
        </div>
      )}
    </div>
  );
}
