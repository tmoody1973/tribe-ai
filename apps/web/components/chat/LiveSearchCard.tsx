"use client";

import { useState } from "react";
import { Globe, ExternalLink, ChevronDown, ChevronUp, AlertCircle, Loader2 } from "lucide-react";

interface ScrapedData {
  url: string;
  title: string;
  preview: string;
}

interface LiveSearchResult {
  success: boolean;
  answer: string;
  sources: string[];
  scrapedData?: ScrapedData[];
  quotaRemaining: number;
  quotaLimit: number;
  dataFreshness?: string;
}

interface LiveSearchCardProps {
  result: LiveSearchResult;
}

export function LiveSearchCard({ result }: LiveSearchCardProps) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="border-4 border-black p-4 bg-green-100 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          <h3 className="font-bold text-lg">Live Search Results</h3>
        </div>
        <span className="text-xs px-2 py-1 bg-white border-2 border-black font-medium">
          {result.quotaRemaining}/{result.quotaLimit} searches left
        </span>
      </div>

      {/* AI-generated answer */}
      <div className="bg-white border-2 border-black p-3 mb-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>
      </div>

      {/* Data freshness indicator */}
      {result.dataFreshness && (
        <p className="text-xs text-gray-600 mb-3">
          Data: {result.dataFreshness}
        </p>
      )}

      {/* Sources section */}
      {result.sources && result.sources.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-2 font-bold text-sm mb-2 hover:underline"
          >
            {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Sources ({result.sources.length})
          </button>

          {showSources && (
            <div className="space-y-2">
              {result.sources.map((source, idx) => {
                const scrapedItem = result.scrapedData?.find(s => s.url === source);
                let hostname = "";
                try {
                  hostname = new URL(source).hostname;
                } catch {
                  hostname = source;
                }

                return (
                  <div key={idx} className="border border-black p-2 bg-white">
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {scrapedItem?.title || hostname}
                    </a>
                    {scrapedItem?.preview && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {scrapedItem.preview}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LiveSearchLoadingProps {
  query?: string;
}

export function LiveSearchLoading({ query }: LiveSearchLoadingProps) {
  return (
    <div className="border-4 border-black p-4 bg-green-50 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <div>
          <h3 className="font-bold">Searching live data...</h3>
          {query && (
            <p className="text-sm text-gray-600 mt-1">Query: {query}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        This may take 10-15 seconds as we search and scrape the latest sources.
      </p>
    </div>
  );
}

interface QuotaExceededCardProps {
  daysUntilReset: number;
  used?: number;
  limit?: number;
}

export function QuotaExceededCard({ daysUntilReset, used = 50, limit = 50 }: QuotaExceededCardProps) {
  return (
    <div className="border-4 border-black p-4 bg-red-100 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-bold">Monthly Search Quota Exceeded</h3>
      </div>
      <p className="text-sm">
        You&apos;ve used all {used} of {limit} live searches for this month.
        Quota resets in <strong>{daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}</strong>.
      </p>
      <div className="mt-3 p-2 bg-white border-2 border-black">
        <p className="text-sm font-medium">What you can do instead:</p>
        <ul className="text-sm mt-1 list-disc list-inside text-gray-600">
          <li>Search our cached housing database</li>
          <li>Check visa requirements from static data</li>
          <li>Ask general migration questions</li>
        </ul>
      </div>
    </div>
  );
}

interface LiveSearchErrorCardProps {
  message: string;
}

export function LiveSearchErrorCard({ message }: LiveSearchErrorCardProps) {
  return (
    <div className="border-4 border-black p-4 bg-orange-100 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <h3 className="font-bold">Search Error</h3>
      </div>
      <p className="text-sm">{message}</p>
      <p className="text-xs text-gray-600 mt-2">
        Try asking your question differently, or use our cached data sources.
      </p>
    </div>
  );
}
