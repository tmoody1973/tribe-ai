"use client";

import { useState } from "react";
import { Plane, Clock, DollarSign, FileText, ChevronDown, ChevronUp, Plus, AlertCircle, Loader2 } from "lucide-react";

interface ProcessingTime {
  averageDays: number;
  source: string;
  cached?: boolean;
}

interface VisaResult {
  success: boolean;
  origin: string;
  destination: string;
  visaRequired: boolean;
  visaType: string;
  stayDuration: string;
  requirements: string[];
  estimatedCost?: string;
  processingTime?: ProcessingTime;
  cached?: boolean;
  quotaRemaining?: number;
}

interface VisaPathwayCardProps {
  result: VisaResult;
  onAddCorridor?: (origin: string, destination: string) => void;
}

export function VisaPathwayCard({ result, onAddCorridor }: VisaPathwayCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleAddCorridor = () => {
    if (onAddCorridor) {
      onAddCorridor(result.origin, result.destination);
    }
  };

  return (
    <div className="border-4 border-black p-4 bg-purple-100 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5" />
          <h3 className="font-bold text-lg">
            {result.origin} → {result.destination}
          </h3>
        </div>
        <span
          className={`px-2 py-1 text-xs font-bold border-2 border-black ${
            result.visaRequired ? "bg-yellow-200" : "bg-green-200"
          }`}
        >
          {result.visaRequired ? "Visa Required" : "Visa Free"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white border-2 border-black p-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FileText className="w-3 h-3" />
            Visa Type
          </div>
          <div className="font-bold text-sm">{result.visaType || "N/A"}</div>
        </div>
        <div className="bg-white border-2 border-black p-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            Stay Duration
          </div>
          <div className="font-bold text-sm">{result.stayDuration || "Varies"}</div>
        </div>
        {result.estimatedCost && (
          <div className="bg-white border-2 border-black p-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <DollarSign className="w-3 h-3" />
              Est. Cost
            </div>
            <div className="font-bold text-sm">{result.estimatedCost}</div>
          </div>
        )}
        {result.processingTime && (
          <div className="bg-white border-2 border-black p-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              Processing
            </div>
            <div className="font-bold text-sm">~{result.processingTime.averageDays} days</div>
          </div>
        )}
      </div>

      {result.requirements && result.requirements.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-bold hover:underline"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Requirements ({result.requirements.length})
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 text-sm bg-white border-2 border-black p-2">
              {result.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Cache indicator */}
      {result.cached && (
        <p className="text-xs text-gray-500 mb-3">
          Data from cache • {result.quotaRemaining !== undefined ? `${result.quotaRemaining} API calls remaining` : ""}
        </p>
      )}

      {onAddCorridor && (
        <div className="flex gap-2">
          <button
            onClick={handleAddCorridor}
            className="flex-1 flex items-center justify-center gap-1 py-2 border-2 border-black bg-blue-200 hover:bg-blue-300 font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add as Corridor
          </button>
        </div>
      )}
    </div>
  );
}

interface VisaSearchLoadingProps {
  origin?: string;
  destination?: string;
}

export function VisaSearchLoading({ origin, destination }: VisaSearchLoadingProps) {
  return (
    <div className="border-4 border-black p-4 bg-purple-50 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <div>
          <h3 className="font-bold">Checking visa requirements...</h3>
          {origin && destination && (
            <p className="text-sm text-gray-600 mt-1">
              {origin} → {destination}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface VisaErrorCardProps {
  message: string;
  suggestions?: string[];
}

export function VisaErrorCard({ message, suggestions }: VisaErrorCardProps) {
  return (
    <div className="border-4 border-black p-4 bg-red-100 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-bold">Visa Search Error</h3>
      </div>
      <p className="text-sm">{message}</p>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-1">Did you mean:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-white border border-black"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
