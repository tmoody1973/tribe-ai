"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { ChevronDown, Star, Plus, Check } from "lucide-react";

interface CorridorSwitcherProps {
  selectedCorridorId: Id<"corridors"> | null;
  onCorridorChange: (corridorId: Id<"corridors">) => void;
  compact?: boolean;
}

export function CorridorSwitcher({
  selectedCorridorId,
  onCorridorChange,
  compact = false,
}: CorridorSwitcherProps) {
  const data = useQuery(api.corridorComparison.getAllCorridorsWithFinancials);
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  const { corridors } = data;
  const selectedCorridor = corridors.find((c: any) => c.corridor._id === selectedCorridorId);

  if (corridors.length === 0) {
    return (
      <div className="border-2 border-black bg-yellow-50 p-3">
        <p className="text-sm font-bold">No journeys yet</p>
        <p className="text-xs text-gray-600">Create your first migration corridor to get started</p>
      </div>
    );
  }

  // Single corridor - no switcher needed
  if (corridors.length === 1 && !compact) {
    const corridor = corridors[0].corridor;
    return (
      <div className="border-2 border-black bg-white p-3 flex items-center justify-between">
        <div>
          <p className="font-bold">{corridor.name || `${corridor.origin} → ${corridor.destination}`}</p>
          <p className="text-xs text-gray-600">Your migration journey</p>
        </div>
        {corridor.isPrimary && (
          <Star size={16} className="text-yellow-500" fill="currentColor" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Corridor Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border-4 border-black bg-white hover:bg-gray-50 shadow-[4px_4px_0_0_#000] transition-all ${
          isOpen ? "shadow-none translate-x-1 translate-y-1" : ""
        } ${compact ? "p-2" : "p-4"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-left">
            {selectedCorridor ? (
              <>
                <div className="flex items-center gap-2">
                  <p className={`font-black ${compact ? "text-sm" : "text-base"}`}>
                    {selectedCorridor.corridor.name ||
                      `${selectedCorridor.corridor.origin} → ${selectedCorridor.corridor.destination}`}
                  </p>
                  {selectedCorridor.corridor.isPrimary && (
                    <Star size={compact ? 12 : 14} className="text-yellow-500" fill="currentColor" />
                  )}
                </div>
                {!compact && (
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedCorridor.savings.fundingPercentage}% funded •{" "}
                    {selectedCorridor.progress.percentage}% tasks complete
                  </p>
                )}
              </>
            ) : (
              <p className={`font-bold text-gray-500 ${compact ? "text-sm" : "text-base"}`}>
                Select a journey
              </p>
            )}
          </div>
          <ChevronDown
            size={compact ? 16 : 20}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 border-4 border-black bg-white shadow-[8px_8px_0_0_#000] z-50 max-h-96 overflow-y-auto">
            {/* Corridor List */}
            {corridors.map((item: any) => {
              const { corridor, savings, progress, feasibilityScore } = item;
              const isSelected = corridor._id === selectedCorridorId;

              return (
                <button
                  key={corridor._id}
                  onClick={() => {
                    onCorridorChange(corridor._id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-4 border-b-2 border-black last:border-b-0 hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 text-left">
                      {/* Corridor Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-black text-sm">
                          {corridor.name || `${corridor.origin} → ${corridor.destination}`}
                        </p>
                        {corridor.isPrimary && (
                          <span className="bg-yellow-400 border-2 border-black px-2 py-0.5 text-xs font-black">
                            PRIMARY
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      {!compact && (
                        <div className="space-y-1">
                          {/* Feasibility */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 border border-black">
                              <div
                                className={`h-full ${
                                  feasibilityScore >= 70
                                    ? "bg-green-500"
                                    : feasibilityScore >= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${feasibilityScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold">{feasibilityScore}%</span>
                          </div>

                          {/* Quick Info */}
                          <div className="flex gap-3 text-xs text-gray-600">
                            <span>{savings.fundingPercentage}% funded</span>
                            <span>•</span>
                            <span>{progress.percentage}% tasks</span>
                            <span>•</span>
                            <span>{savings.goalsCount} goals</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <Check size={20} className="text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Add New Corridor */}
            <button
              onClick={() => {
                window.location.href = "/onboarding?step=corridor";
                setIsOpen(false);
              }}
              className="w-full p-4 border-t-4 border-black bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 font-black"
            >
              <Plus size={20} />
              Create New Journey
            </button>

            {/* Compare All Link */}
            {corridors.length > 1 && (
              <button
                onClick={() => {
                  window.location.href = "/corridors/compare";
                  setIsOpen(false);
                }}
                className="w-full p-3 border-t-2 border-black bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-bold"
              >
                📊 Compare All Journeys
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact variant for headers/navbars
 */
export function CompactCorridorSwitcher({
  selectedCorridorId,
  onCorridorChange,
}: Omit<CorridorSwitcherProps, "compact">) {
  return (
    <CorridorSwitcher
      selectedCorridorId={selectedCorridorId}
      onCorridorChange={onCorridorChange}
      compact={true}
    />
  );
}
