"use client";

import { ExternalLink, Home, Loader2 } from "lucide-react";

interface HousingResource {
  country: string;
  continent: string;
  organization: string;
  url: string;
  description: string;
  type: string;
  services: string[];
}

interface HousingResourcesCardProps {
  results: HousingResource[];
  totalFound: number;
  isLoading?: boolean;
  searchCountry?: string;
}

export function HousingResourcesCard({
  results,
  totalFound,
  isLoading,
  searchCountry,
}: HousingResourcesCardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 border-4 border-black bg-gray-100 shadow-[4px_4px_0_0_#000]">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="font-medium">
          Searching housing resources{searchCountry ? ` in ${searchCountry}` : ""}...
        </span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 border-4 border-black bg-yellow-50 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span className="font-medium">No housing resources found</span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Try searching with different criteria or use live search for the latest data.
        </p>
      </div>
    );
  }

  return (
    <div className="border-4 border-black p-4 bg-yellow-100 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-2 mb-3">
        <Home className="w-5 h-5" />
        <h3 className="font-bold text-lg">Housing Resources</h3>
        <span className="text-sm text-gray-600">
          ({totalFound} found{totalFound > 10 ? ", showing 10" : ""})
        </span>
      </div>

      <div className="space-y-3">
        {results.map((resource, idx) => (
          <div
            key={idx}
            className="border-2 border-black p-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{resource.organization}</h4>
                <p className="text-sm text-gray-600">
                  {resource.type} &bull; {resource.country}
                </p>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 border-2 border-black bg-blue-200 hover:bg-blue-300 transition-colors"
                title={`Visit ${resource.organization}`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-2 text-sm line-clamp-2">{resource.description}</p>
            {resource.services && resource.services.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {resource.services.slice(0, 4).map((service, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-gray-100 border border-black"
                  >
                    {service}
                  </span>
                ))}
                {resource.services.length > 4 && (
                  <span className="text-xs px-2 py-1 text-gray-500">
                    +{resource.services.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface LiveSearchPromptProps {
  suggestion: {
    message: string;
    action: string;
    actionLabel: string;
    note: string;
  };
  onSearch?: () => void;
}

export function LiveSearchPrompt({ suggestion, onSearch }: LiveSearchPromptProps) {
  return (
    <div className="border-4 border-black p-4 bg-orange-100 shadow-[4px_4px_0_0_#000]">
      <p className="font-medium">{suggestion.message}</p>
      <p className="mt-1 text-xs text-gray-600">{suggestion.note}</p>
      {onSearch && (
        <button
          onClick={onSearch}
          className="mt-3 px-4 py-2 border-2 border-black bg-white hover:bg-orange-200 font-bold transition-colors"
        >
          {suggestion.actionLabel}
        </button>
      )}
    </div>
  );
}
