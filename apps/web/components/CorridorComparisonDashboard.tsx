"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  CheckCircle2,
  Circle,
  Star,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export function CorridorComparisonDashboard() {
  const data = useQuery(api.corridorComparison.getAllCorridorsWithFinancials);
  const setPrimary = useMutation(api.corridorComparison.setPrimaryCorridor);
  const updateAllocation = useMutation(api.corridorComparison.updateSavingsAllocation);

  const [expandedCorridor, setExpandedCorridor] = useState<Id<"corridors"> | null>(null);
  const [allocationMode, setAllocationMode] = useState(false);

  if (!data) {
    return (
      <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
        <p className="text-center text-gray-500">Loading your journeys...</p>
      </div>
    );
  }

  const { corridors, primaryCorridor, totalCorridors } = data;

  const totalAllocated = corridors.reduce(
    (sum: number, c: any) => sum + (c.corridor.allocatedSavings || 0),
    0
  );

  const handleSetPrimary = async (corridorId: Id<"corridors">) => {
    await setPrimary({ corridorId, enableAllocation: allocationMode });
  };

  const getFeasibilityColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getFeasibilityLabel = (score: number) => {
    if (score >= 70) return "Highly Feasible";
    if (score >= 40) return "Moderately Feasible";
    return "Challenging";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-4 border-black bg-gradient-to-r from-purple-100 to-blue-100 p-6 shadow-[8px_8px_0_0_#000]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Your Migration Journeys
            </h1>
            <p className="text-gray-700 mt-2">
              Compare destinations, track progress, and focus your efforts
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Journeys</p>
            <p className="text-4xl font-black">{totalCorridors}</p>
          </div>
        </div>
      </div>

      {/* Allocation Mode Toggle */}
      {primaryCorridor && (
        <div className="border-4 border-black bg-yellow-50 p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">💡 Allocation Mode</p>
              <p className="text-xs text-gray-600">
                Track how much of your savings goes to each journey
              </p>
            </div>
            <label className="relative inline-block w-14 h-7 cursor-pointer">
              <input
                type="checkbox"
                checked={allocationMode}
                onChange={(e) => setAllocationMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-full h-full bg-gray-300 peer-checked:bg-purple-500 border-2 border-black transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-6 h-6 bg-white border-2 border-black peer-checked:translate-x-7 transition-transform" />
            </label>
          </div>
          {allocationMode && (
            <div className="mt-3 p-3 bg-white border-2 border-black">
              <p className="text-sm font-bold mb-1">Total Allocated: ${totalAllocated.toLocaleString()}</p>
              <div className="h-2 bg-gray-200 border-2 border-black">
                {corridors.map((c: any, idx: number) => {
                  const percentage = totalAllocated > 0 ? ((c.corridor.allocatedSavings || 0) / totalAllocated) * 100 : 0;
                  const colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"];
                  return (
                    <div
                      key={c.corridor._id}
                      className={`h-full ${colors[idx % colors.length]}`}
                      style={{ width: `${percentage}%`, display: "inline-block" }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Corridor Cards */}
      <div className="space-y-4">
        {corridors.map((item: any, index: number) => {
          const { corridor, budget, savings, progress, feasibilityScore } = item;
          const isPrimary = corridor.isPrimary === true;
          const isExpanded = expandedCorridor === corridor._id;

          return (
            <div
              key={corridor._id}
              className={`border-4 border-black shadow-[6px_6px_0_0_#000] transition-all ${
                isPrimary
                  ? "bg-gradient-to-br from-yellow-50 to-orange-50"
                  : "bg-white hover:shadow-[8px_8px_0_0_#000]"
              }`}
            >
              {/* Card Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() =>
                  setExpandedCorridor(isExpanded ? null : corridor._id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black">
                        {corridor.name || `${corridor.origin} → ${corridor.destination}`}
                      </h3>
                      {isPrimary && (
                        <span className="bg-yellow-400 border-2 border-black px-3 py-1 text-xs font-black flex items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          PRIMARY
                        </span>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {/* Feasibility Score */}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Feasibility</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-gray-200 border-2 border-black">
                            <div
                              className={`h-full ${getFeasibilityColor(feasibilityScore)}`}
                              style={{ width: `${feasibilityScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-black">{feasibilityScore}%</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {getFeasibilityLabel(feasibilityScore)}
                        </p>
                      </div>

                      {/* Funding Progress */}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Funding</p>
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} />
                          <span className="font-bold">
                            {formatCurrency(savings.totalSaved, budget.currency as any)} / {formatCurrency(savings.totalTarget, budget.currency as any)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {savings.fundingPercentage}% funded
                        </p>
                      </div>

                      {/* Protocol Progress */}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tasks</p>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          <span className="font-bold">
                            {progress.protocolsCompleted} / {progress.protocolsTotal}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {progress.percentage}% complete
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <ChevronRight
                    className={`w-6 h-6 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t-4 border-black bg-white p-6 space-y-4">
                  {/* Savings Goals */}
                  <div>
                    <h4 className="font-black mb-2">💰 Savings Goals</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 border-2 border-black">
                        <p className="text-gray-600">Active Goals</p>
                        <p className="font-bold text-lg">{savings.activeGoalsCount}</p>
                      </div>
                      <div className="p-2 border-2 border-black">
                        <p className="text-gray-600">Total Target</p>
                        <p className="font-bold text-lg">
                          {formatCurrency(savings.totalTarget, budget.currency as any)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Allocation */}
                  {allocationMode && (
                    <div>
                      <h4 className="font-black mb-2">📊 Savings Allocation</h4>
                      <input
                        type="number"
                        value={corridor.allocatedSavings || 0}
                        onChange={(e) =>
                          updateAllocation({
                            corridorId: corridor._id,
                            allocatedAmount: Number(e.target.value),
                          })
                        }
                        className="w-full p-3 border-2 border-black font-mono text-lg"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        How much of your total savings is allocated to this journey?
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(corridor._id)}
                        className="flex-1 p-3 bg-yellow-400 hover:bg-yellow-500 border-4 border-black font-black shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                      >
                        <Star size={16} className="inline mr-2" />
                        Set as Primary
                      </button>
                    )}
                    <button
                      onClick={() => (window.location.href = `/corridor/${corridor._id}`)}
                      className="flex-1 p-3 bg-white hover:bg-gray-100 border-4 border-black font-black shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      View Details
                      <ChevronRight size={16} className="inline ml-2" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {corridors.length > 1 && (
        <div className="border-4 border-purple-500 bg-purple-50 p-6 shadow-[8px_8px_0_0_#000]">
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Smart Recommendations
          </h3>
          <div className="space-y-3">
            {/* Recommendation 1: Focus on most feasible */}
            {corridors[0] && corridors[0].feasibilityScore >= 50 && (
              <div className="flex items-start gap-3 p-3 bg-white border-2 border-black">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Focus on {corridors[0].corridor.name || corridors[0].corridor.destination}</p>
                  <p className="text-sm text-gray-600">
                    {corridors[0].feasibilityScore}% feasible - you're {corridors[0].savings.fundingPercentage}% funded with {corridors[0].progress.percentage}% of tasks complete
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation 2: Pause least feasible */}
            {corridors.length >= 3 && corridors[corridors.length - 1].feasibilityScore < 30 && (
              <div className="flex items-start gap-3 p-3 bg-white border-2 border-black">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">
                    Consider pausing {corridors[corridors.length - 1].corridor.name || corridors[corridors.length - 1].corridor.destination}
                  </p>
                  <p className="text-sm text-gray-600">
                    Only {corridors[corridors.length - 1].savings.fundingPercentage}% funded - reallocate savings to higher-priority journeys
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation 3: Allocation suggestion */}
            {!allocationMode && corridors.length >= 2 && (
              <div className="flex items-start gap-3 p-3 bg-white border-2 border-black">
                <Target className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Enable Allocation Mode</p>
                  <p className="text-sm text-gray-600">
                    Track how your savings are divided across {corridors.length} journeys
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
