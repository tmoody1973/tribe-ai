"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Target, Calendar, DollarSign } from "lucide-react";

interface SavingsGoalModalProps {
  corridor: {
    _id: Id<"corridors">;
  };
  budget: {
    _id: Id<"financialBudgets">;
    destinationCurrency: string;
  };
  onClose: () => void;
}

export function SavingsGoalModal({
  corridor,
  budget,
  onClose,
}: SavingsGoalModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [enableMilestones, setEnableMilestones] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const createSavingsGoal = useMutation(api.financial.createSavingsGoal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || parseFloat(targetAmount) <= 0) return;

    setIsCreating(true);
    try {
      await createSavingsGoal({
        corridorId: corridor._id,
        budgetId: budget._id,
        name,
        description: description || undefined,
        targetAmount: parseFloat(targetAmount),
        currency: budget.destinationCurrency,
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
        enableMilestones,
      });

      onClose();
    } catch (error) {
      console.error("Failed to create savings goal:", error);
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-yellow-100">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            <h2 className="text-xl font-black">Create Savings Goal</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-black hover:text-white p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Goal Name */}
          <div>
            <label className="block font-bold mb-2">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emergency Fund"
              maxLength={100}
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="3 months of living expenses for unexpected emergencies"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Target Amount and Target Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">
                Target Amount <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-gray-600" />
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="5000"
                  step="0.01"
                  min="0.01"
                  className="flex-1 px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                in {budget.destinationCurrency}
              </p>
            </div>

            <div>
              <label className="block font-bold mb-2">Target Date (Optional)</label>
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-600" />
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Milestones Option */}
          <div className="border-2 border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="enableMilestones"
                checked={enableMilestones}
                onChange={(e) => setEnableMilestones(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <label htmlFor="enableMilestones" className="font-bold text-sm">
                  Enable Milestones
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Track your progress with automatic milestones at 25%, 50%, 75%, and 100%
                </p>
                {enableMilestones && targetAmount && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>🎯 25%: {budget.destinationCurrency} {(parseFloat(targetAmount) * 0.25).toFixed(2)}</div>
                    <div>🎯 50%: {budget.destinationCurrency} {(parseFloat(targetAmount) * 0.50).toFixed(2)}</div>
                    <div>🎯 75%: {budget.destinationCurrency} {(parseFloat(targetAmount) * 0.75).toFixed(2)}</div>
                    <div>🎯 100%: {budget.destinationCurrency} {parseFloat(targetAmount).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name || !targetAmount}
              className="flex-1 px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
