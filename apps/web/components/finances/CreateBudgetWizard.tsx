"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import {
  getDefaultCurrency,
  getCurrencyOptions,
  formatCurrency,
  SupportedCurrency,
} from "@/lib/utils/currency";

interface CreateBudgetWizardProps {
  corridor: {
    _id: Id<"corridors">;
    origin: string;
    destination: string;
  };
}

// Default budget allocations
const DEFAULT_ALLOCATIONS = {
  visaImmigration: 0.25, // 25%
  tests: 0.15, // 15%
  travel: 0.20, // 20%
  settlement: 0.25, // 25%
  financial: 0.10, // 10%
  miscellaneous: 0.05, // 5%
};

// Corridor-specific budget templates
interface BudgetTemplate {
  name: string;
  allocations: typeof DEFAULT_ALLOCATIONS;
  description: string;
}

const BUDGET_TEMPLATES: Record<string, BudgetTemplate> = {
  "Nigeria-Canada": {
    name: "Nigeria → Canada",
    allocations: {
      visaImmigration: 0.30, // Higher due to express entry
      tests: 0.20, // IELTS + WES evaluation
      travel: 0.15,
      settlement: 0.25,
      financial: 0.05,
      miscellaneous: 0.05,
    },
    description: "Optimized for Nigerian migrants moving to Canada via Express Entry",
  },
  "India-United States": {
    name: "India → USA",
    allocations: {
      visaImmigration: 0.25,
      tests: 0.20, // GRE/GMAT + TOEFL/IELTS
      travel: 0.15,
      settlement: 0.30,
      financial: 0.05,
      miscellaneous: 0.05,
    },
    description: "Optimized for Indian students/workers moving to USA",
  },
  "Philippines-United Kingdom": {
    name: "Philippines → UK",
    allocations: {
      visaImmigration: 0.25,
      tests: 0.15,
      travel: 0.25, // Higher travel costs
      settlement: 0.25,
      financial: 0.05,
      miscellaneous: 0.05,
    },
    description: "Optimized for Filipino workers moving to UK",
  },
};

export function CreateBudgetWizard({ corridor }: CreateBudgetWizardProps) {
  const [totalBudget, setTotalBudget] = useState("");
  const [originCurrency, setOriginCurrency] = useState<SupportedCurrency>("USD");
  const [destinationCurrency, setDestinationCurrency] = useState<SupportedCurrency>("USD");
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAllocations, setCustomAllocations] = useState(DEFAULT_ALLOCATIONS);
  const [useCustomAllocations, setUseCustomAllocations] = useState(false);

  const createBudget = useMutation(api.financial.createBudget);
  const getExchangeRate = useQuery(
    api.financial.getExchangeRate,
    originCurrency !== destinationCurrency
      ? { from: originCurrency, to: destinationCurrency }
      : "skip"
  );

  // Auto-detect currencies from corridor
  useEffect(() => {
    const detectedDestCurrency = getDefaultCurrency(corridor.destination);
    const detectedOriginCurrency = getDefaultCurrency(corridor.origin);
    setDestinationCurrency(detectedDestCurrency);
    setOriginCurrency(detectedOriginCurrency);
  }, [corridor.destination, corridor.origin]);

  // Get corridor-specific template
  const corridorKey = `${corridor.origin}-${corridor.destination}`;
  const template = BUDGET_TEMPLATES[corridorKey];

  // Use template allocations if available, otherwise default
  const effectiveAllocations = useCustomAllocations
    ? customAllocations
    : template?.allocations || DEFAULT_ALLOCATIONS;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalBudget || parseFloat(totalBudget) <= 0) return;

    setIsCreating(true);
    try {
      const budget = parseFloat(totalBudget);
      const exchangeRate = getExchangeRate || 1;

      await createBudget({
        corridorId: corridor._id,
        originCurrency,
        destinationCurrency,
        totalBudgetDestination: budget,
        exchangeRate,
        allocations: {
          visaImmigration: budget * effectiveAllocations.visaImmigration,
          tests: budget * effectiveAllocations.tests,
          travel: budget * effectiveAllocations.travel,
          settlement: budget * effectiveAllocations.settlement,
          financial: budget * effectiveAllocations.financial,
          miscellaneous: budget * effectiveAllocations.miscellaneous,
        },
      });

      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error("Failed to create budget:", error);
      setIsCreating(false);
    }
  };

  // Update individual allocation
  const handleAllocationChange = (category: keyof typeof DEFAULT_ALLOCATIONS, value: number) => {
    setCustomAllocations((prev) => ({
      ...prev,
      [category]: value / 100, // Convert percentage to decimal
    }));
  };

  // Calculate total percentage for validation
  const totalAllocationPercentage = Object.values(customAllocations).reduce(
    (sum, val) => sum + val * 100,
    0
  );

  const currencyOptions = getCurrencyOptions();

  return (
    <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-black">Create Your Migration Budget</h2>
          <p className="text-gray-600">
            Set a budget to start tracking your migration expenses
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        {/* Corridor Template Info */}
        {template && (
          <div className="border-2 border-blue-500 bg-blue-50 p-3">
            <p className="font-bold text-sm">✨ {template.name} Template Detected</p>
            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
          </div>
        )}

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-2 text-sm">Origin Currency</label>
            <select
              value={originCurrency}
              onChange={(e) => setOriginCurrency(e.target.value as SupportedCurrency)}
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">{corridor.origin}</p>
          </div>
          <div>
            <label className="block font-bold mb-2 text-sm">Destination Currency</label>
            <select
              value={destinationCurrency}
              onChange={(e) => setDestinationCurrency(e.target.value as SupportedCurrency)}
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">{corridor.destination}</p>
          </div>
        </div>

        {/* Exchange Rate Display */}
        {originCurrency !== destinationCurrency && getExchangeRate && (
          <div className="border-2 border-gray-200 bg-gray-50 p-3">
            <p className="text-sm">
              <span className="font-bold">Exchange Rate:</span> 1 {destinationCurrency} ={" "}
              {getExchangeRate.toFixed(4)} {originCurrency}
            </p>
          </div>
        )}

        {/* Total Budget Input */}
        <div>
          <label className="block font-bold mb-2">Total Budget (in {destinationCurrency}) *</label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            placeholder="8500"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {totalBudget && originCurrency !== destinationCurrency && getExchangeRate && (
            <p className="text-xs text-gray-600 mt-1">
              ≈ {formatCurrency(parseFloat(totalBudget) * getExchangeRate, originCurrency)} in origin currency
            </p>
          )}
        </div>

        {/* Allocation Preview */}
        <div className="border-2 border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold">
              {useCustomAllocations ? "Custom" : template ? "Template" : "Default"} Allocation:
            </p>
            {!useCustomAllocations && (
              <button
                type="button"
                onClick={() => {
                  setUseCustomAllocations(true);
                  setShowAdvanced(true);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Customize
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>📋 Visa & Immigration: {Math.round(effectiveAllocations.visaImmigration * 100)}%</div>
            <div>🎓 Tests: {Math.round(effectiveAllocations.tests * 100)}%</div>
            <div>✈️ Travel: {Math.round(effectiveAllocations.travel * 100)}%</div>
            <div>🏠 Settlement: {Math.round(effectiveAllocations.settlement * 100)}%</div>
            <div>💳 Financial: {Math.round(effectiveAllocations.financial * 100)}%</div>
            <div>📱 Miscellaneous: {Math.round(effectiveAllocations.miscellaneous * 100)}%</div>
          </div>
        </div>

        {/* Advanced Options - Custom Allocations */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-bold hover:text-blue-600"
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 border-2 border-gray-300 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="useCustom"
                  checked={useCustomAllocations}
                  onChange={(e) => setUseCustomAllocations(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="useCustom" className="font-bold text-sm">
                  Use Custom Allocations
                </label>
              </div>

              {useCustomAllocations && (
                <>
                  {Object.entries(customAllocations).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm mb-1 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value * 100}
                        onChange={(e) =>
                          handleAllocationChange(
                            key as keyof typeof DEFAULT_ALLOCATIONS,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>0%</span>
                        <span className="font-bold">{Math.round(value * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  ))}

                  {/* Validation Message */}
                  {totalAllocationPercentage !== 100 && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 p-2 text-xs">
                      ⚠️ Total must equal 100% (currently {Math.round(totalAllocationPercentage)}%)
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={
            isCreating ||
            !totalBudget ||
            (useCustomAllocations && totalAllocationPercentage !== 100)
          }
          className="w-full px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCreating ? "Creating Budget..." : "Create Budget"}
        </button>
      </form>
    </div>
  );
}
