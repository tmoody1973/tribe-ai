"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft } from "lucide-react";

interface CurrencyConverterProps {
  originCurrency: { code: string; symbol: string; name: string };
  destinationCurrency: { code: string; symbol: string; name: string };
}

// Static exchange rates (fallback - would ideally fetch from API)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  NGN: { USD: 0.00063, EUR: 0.00059, GBP: 0.0005, CAD: 0.00086, INR: 0.053 },
  USD: { NGN: 1587, EUR: 0.93, GBP: 0.79, CAD: 1.36, INR: 83.5, PHP: 56.5, BRL: 4.97 },
  EUR: { USD: 1.08, NGN: 1710, GBP: 0.85, CAD: 1.47, INR: 90 },
  GBP: { USD: 1.27, NGN: 2015, EUR: 1.18, CAD: 1.73, INR: 106 },
  INR: { USD: 0.012, NGN: 19, EUR: 0.011, GBP: 0.0094 },
  PHP: { USD: 0.018, EUR: 0.017, GBP: 0.014 },
  BRL: { USD: 0.20, EUR: 0.19, GBP: 0.16 },
  CAD: { USD: 0.74, EUR: 0.68, GBP: 0.58, NGN: 1175 },
};

function getExchangeRate(from: string, to: string): number {
  if (from === to) return 1;
  if (EXCHANGE_RATES[from]?.[to]) return EXCHANGE_RATES[from][to];
  // Try reverse
  if (EXCHANGE_RATES[to]?.[from]) return 1 / EXCHANGE_RATES[to][from];
  // Default fallback
  return 1;
}

export function CurrencyConverter({
  originCurrency,
  destinationCurrency,
}: CurrencyConverterProps) {
  const t = useTranslations("stats.currency");
  const [amount, setAmount] = useState(100);
  const [isReversed, setIsReversed] = useState(false);

  const fromCurrency = isReversed ? destinationCurrency : originCurrency;
  const toCurrency = isReversed ? originCurrency : destinationCurrency;

  const exchangeRate = getExchangeRate(fromCurrency.code, toCurrency.code);
  const converted = amount * exchangeRate;

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <h3 className="text-lg font-bold mb-4 border-b-2 border-black pb-2">
        {t("title")}
      </h3>

      {/* Exchange Rate Display */}
      <div className="text-center mb-4 p-3 bg-yellow-50 border-2 border-yellow-400">
        <span className="text-2xl font-bold">
          1 {fromCurrency.code} = {exchangeRate.toFixed(exchangeRate < 1 ? 4 : 2)} {toCurrency.code}
        </span>
      </div>

      {/* Converter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">
            {fromCurrency.name} ({fromCurrency.code})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
              {fromCurrency.symbol}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full border-4 border-black p-2 pl-10 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              min="0"
            />
          </div>
        </div>

        <button
          onClick={() => setIsReversed(!isReversed)}
          className="p-3 border-4 border-black hover:bg-gray-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[2px_2px_0_0_#000] transition-all"
          aria-label="Swap currencies"
        >
          <ArrowRightLeft size={20} />
        </button>

        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">
            {toCurrency.name} ({toCurrency.code})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
              {toCurrency.symbol}
            </span>
            <div className="w-full border-4 border-black p-2 pl-10 font-bold text-lg bg-gray-50">
              {converted.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 flex-wrap">
        {[10, 100, 500, 1000].map((quickAmount) => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount)}
            className={`px-3 py-1 border-2 border-black text-sm font-bold transition-colors ${
              amount === quickAmount ? "bg-black text-white" : "hover:bg-gray-100"
            }`}
          >
            {fromCurrency.symbol}{quickAmount}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {t("rateDisclaimer")}
      </p>
    </div>
  );
}
