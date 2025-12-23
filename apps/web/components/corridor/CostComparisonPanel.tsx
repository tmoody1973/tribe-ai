"use client";

import { useTranslations } from "next-intl";

interface CostComparisonPanelProps {
  costs: {
    rentIndex: number;
    groceriesIndex: number;
    transportIndex: number;
    utilitiesIndex: number;
    overallIndex: number;
    difference: number;
    originCity: string;
    destinationCity: string;
    stale?: boolean;
  };
  originName: string;
  destinationName: string;
  originCurrency: { code: string; symbol: string };
  destinationCurrency: { code: string; symbol: string };
}

export function CostComparisonPanel({
  costs,
  originName,
  destinationName,
}: CostComparisonPanelProps) {
  const t = useTranslations("stats.costs");

  const categories = [
    { key: "rent", label: t("rent"), icon: "🏠", index: costs.rentIndex },
    { key: "groceries", label: t("groceries"), icon: "🛒", index: costs.groceriesIndex },
    { key: "transport", label: t("transport"), icon: "🚌", index: costs.transportIndex },
    { key: "utilities", label: t("utilities"), icon: "💡", index: costs.utilitiesIndex },
  ];

  const isMoreExpensive = costs.difference > 0;

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <h3 className="text-lg font-bold mb-4 border-b-2 border-black pb-2">
        {t("title")}
      </h3>

      {/* Overall difference badge */}
      <div className="mb-4 text-center">
        <div
          className={`inline-block px-4 py-2 border-2 border-black font-bold ${
            isMoreExpensive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {destinationName} {t("is")}{" "}
          <span className="text-xl">{Math.abs(costs.difference)}%</span>{" "}
          {isMoreExpensive ? t("moreExpensive") : t("lessExpensive")} {t("than")}{" "}
          {originName}
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4 text-center">
        {costs.originCity} vs {costs.destinationCity}
      </div>

      <div className="space-y-4">
        {categories.map(({ key, label, icon, index }) => {
          // Index is relative to a baseline (usually NYC = 100)
          // We show where each city falls on the scale
          const maxIndex = 100;
          const barWidth = Math.min((index / maxIndex) * 100, 100);

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{icon}</span>
                  {label}
                </span>
                <span className="font-bold text-gray-600">
                  {index}/100
                </span>
              </div>

              {/* Index Bar */}
              <div className="h-4 bg-gray-100 border border-black relative">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
                {/* Marker for baseline (100) */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-black"
                  style={{ left: "100%" }}
                  title="NYC baseline (100)"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall index */}
      <div className="mt-4 pt-4 border-t-2 border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-bold">{t("overall")}</span>
          <span className="text-xl font-bold">{costs.overallIndex}/100</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {t("disclaimer")}
        {costs.stale && (
          <span className="text-orange-500 ml-2">{t("staleWarning")}</span>
        )}
      </p>
    </div>
  );
}
