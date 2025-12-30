"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Target, Calendar, Play, Pause, Plus, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import confetti from "canvas-confetti";

interface Milestone {
  amount: number;
  label: string;
  achieved: boolean;
  achievedAt?: number;
}

interface SavingsGoal {
  _id: Id<"savingsGoals">;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: number;
  milestones?: Milestone[];
  status: "active" | "completed" | "paused";
  completedAt?: number;
}

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export function SavingsGoalCard({ goal }: SavingsGoalCardProps) {
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const updateGoalProgress = useMutation(api.financial.updateGoalProgress);
  const pauseGoal = useMutation(api.financial.pauseGoal);
  const resumeGoal = useMutation(api.financial.resumeGoal);

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const daysRemaining = goal.targetDate
    ? Math.max(0, Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountToAdd || parseFloat(amountToAdd) <= 0) return;

    setIsUpdating(true);
    try {
      const result = await updateGoalProgress({
        goalId: goal._id,
        amountToAdd: parseFloat(amountToAdd),
      });

      // Celebrate milestones
      if (result.newlyAchievedMilestones.length > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Celebrate completion
      if (result.isCompleted) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347"],
        });
      }

      setShowAddSavings(false);
      setAmountToAdd("");
    } catch (error) {
      console.error("Failed to add savings:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePauseResume = async () => {
    try {
      if (goal.status === "active") {
        await pauseGoal({ goalId: goal._id });
      } else if (goal.status === "paused") {
        await resumeGoal({ goalId: goal._id });
      }
    } catch (error) {
      console.error("Failed to update goal status:", error);
    }
  };

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] relative overflow-hidden">
      {/* Status Badge */}
      <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold ${
        goal.status === "completed" ? "bg-green-400" :
        goal.status === "paused" ? "bg-gray-400" :
        "bg-blue-400"
      }`}>
        {goal.status.toUpperCase()}
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-20">
            <h3 className="text-xl font-black">{goal.name}</h3>
            {goal.description && (
              <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
            )}
          </div>
        </div>

        {/* Amount Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-bold">
              {formatCurrency(goal.currentAmount, goal.currency as any)}
            </span>
            <span className="text-gray-600">
              of {formatCurrency(goal.targetAmount, goal.currency as any)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-6 bg-gray-200 border-2 border-black">
            <div
              className={`h-full transition-all duration-500 ${
                progress >= 100 ? "bg-green-500" :
                progress >= 75 ? "bg-blue-500" :
                progress >= 50 ? "bg-yellow-500" :
                "bg-orange-500"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {Math.round(progress)}%
            </span>

            {/* Milestone Markers */}
            {goal.milestones && goal.milestones.map((milestone, index) => {
              const position = (milestone.amount / goal.targetAmount) * 100;
              return (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-0.5 bg-black"
                  style={{ left: `${position}%` }}
                  title={`${milestone.label}: ${formatCurrency(milestone.amount, goal.currency as any)}`}
                >
                  {milestone.achieved && (
                    <div className="absolute -top-1 -left-2 text-green-600">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Days Remaining */}
        {daysRemaining !== null && goal.status === "active" && (
          <div className={`text-sm mb-3 flex items-center gap-2 ${
            daysRemaining <= 30 ? "text-red-600 font-bold" :
            daysRemaining <= 90 ? "text-yellow-600" :
            "text-gray-600"
          }`}>
            <Calendar size={16} />
            <span>{daysRemaining} days remaining</span>
          </div>
        )}

        {/* Milestones Achieved */}
        {goal.milestones && (
          <div className="flex gap-1 mb-3">
            {goal.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex-1 h-2 border border-black ${
                  milestone.achieved ? "bg-green-400" : "bg-gray-200"
                }`}
                title={milestone.label}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {goal.status !== "completed" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddSavings(true)}
              disabled={goal.status === "paused"}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Savings
            </button>
            <button
              onClick={handlePauseResume}
              className="px-3 py-2 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
              title={goal.status === "active" ? "Pause" : "Resume"}
            >
              {goal.status === "active" ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        )}

        {/* Completed Badge */}
        {goal.status === "completed" && (
          <div className="bg-green-400 border-2 border-black p-3 text-center">
            <p className="font-black text-lg">🎉 Goal Achieved!</p>
            {goal.completedAt && (
              <p className="text-xs mt-1">
                Completed on {new Date(goal.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add Savings Modal */}
      {showAddSavings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddSavings(false)}
        >
          <div
            className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-black mb-4">Add Savings to {goal.name}</h3>
              <form onSubmit={handleAddSavings} className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Amount to Add</label>
                  <input
                    type="number"
                    value={amountToAdd}
                    onChange={(e) => setAmountToAdd(e.target.value)}
                    placeholder="100"
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddSavings(false)}
                    className="flex-1 px-4 py-2 border-2 border-black font-bold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    {isUpdating ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
