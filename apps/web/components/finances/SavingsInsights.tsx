"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TrendingUp, Target, Flame, AlertTriangle, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface SavingsInsightsProps {
  corridorId: Id<"corridors">;
  currency: string;
}

export function SavingsInsights({ corridorId, currency }: SavingsInsightsProps) {
  const goals = useQuery(api.financial.getSavingsGoals, { corridorId });
  const velocity = useQuery(api.financial.getSavingsVelocity, { corridorId, periodDays: 30 });
  const streak = useQuery(api.financial.getSavingsStreak, { corridorId });

  if (!goals || !velocity) return null;

  const totalSaved = goals.reduce((sum: number, g: any) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum: number, g: any) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const activeGoals = goals.filter((g: any) => g.status === "active").length;

  // Identify at-risk goals
  const atRiskGoals = goals.filter((goal: any) => {
    if (!goal.targetDate || goal.status !== "active") return false;
    const totalDays = goal.targetDate - goal.createdAt;
    const daysElapsed = Date.now() - goal.createdAt;
    const expectedProgress = (daysElapsed / totalDays) * goal.targetAmount;
    return goal.currentAmount < expectedProgress * 0.8; // 20% behind
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">💡 Savings Insights</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Saved */}
        <div className="border-4 border-black bg-blue-50 p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <p className="font-bold text-sm">Total Saved</p>
          </div>
          <p className="text-2xl font-black">{formatCurrency(totalSaved, currency as any)}</p>
          <p className="text-xs text-gray-600 mt-1">
            of {formatCurrency(totalTarget, currency as any)} ({Math.round(overallProgress)}%)
          </p>
        </div>

        {/* Active Goals */}
        <div className="border-4 border-black bg-green-50 p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="font-bold text-sm">Active Goals</p>
          </div>
          <p className="text-2xl font-black">{activeGoals}</p>
          <p className="text-xs text-gray-600 mt-1">
            {goals.filter((g: any) => g.status === "completed").length} completed
          </p>
        </div>

        {/* Savings Streak */}
        <div className="border-4 border-black bg-orange-50 p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" />
            <p className="font-bold text-sm">Current Streak</p>
          </div>
          <p className="text-2xl font-black">{streak?.currentStreak || 0} weeks 🔥</p>
          <p className="text-xs text-gray-600 mt-1">
            Best: {streak?.longestStreak || 0} weeks
          </p>
        </div>
      </div>

      {/* Savings Velocity */}
      <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
        <h3 className="font-black mb-3">📈 Savings Velocity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Per Week</p>
            <p className="font-bold">{formatCurrency(velocity.avgPerWeek, currency as any)}</p>
          </div>
          <div>
            <p className="text-gray-600">Per Month</p>
            <p className="font-bold">{formatCurrency(velocity.avgPerMonth, currency as any)}</p>
          </div>
          <div>
            <p className="text-gray-600">Contributions</p>
            <p className="font-bold">{velocity.contributionCount}</p>
          </div>
          <div>
            <p className="text-gray-600">Consistency</p>
            <p className="font-bold">{velocity.consistency}%</p>
          </div>
        </div>
        {velocity.avgPerWeek > 0 && totalTarget > totalSaved && (
          <p className="text-xs text-gray-600 mt-3">
            At current rate, you'll complete all goals in ~
            {Math.ceil((totalTarget - totalSaved) / velocity.avgPerWeek)} weeks
          </p>
        )}
      </div>

      {/* At-Risk Goals Warning */}
      {atRiskGoals.length > 0 && (
        <div className="border-4 border-red-500 bg-red-50 p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-black text-red-600">⚠️ Goals Behind Schedule</h3>
          </div>
          <div className="space-y-2">
            {atRiskGoals.map((goal: any) => {
              const daysRemaining = goal.targetDate
                ? Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24))
                : 0;
              const remaining = goal.targetAmount - goal.currentAmount;
              const weeklyNeeded = daysRemaining > 0 ? (remaining / daysRemaining) * 7 : 0;

              return (
                <div key={goal._id} className="text-sm">
                  <p className="font-bold">{goal.name}</p>
                  <p className="text-xs text-gray-600">
                    Save {formatCurrency(weeklyNeeded, currency as any)}/week to catch up ({daysRemaining} days left)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="border-4 border-black bg-purple-50 p-4 shadow-[4px_4px_0_0_#000]">
        <h3 className="font-black mb-3">💡 Smart Insights</h3>
        <div className="space-y-2 text-sm">
          {/* Achievement Insights */}
          {overallProgress >= 80 && (
            <div className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <p>
                <span className="font-bold">Excellent progress!</span> You're {Math.round(overallProgress)}% of
                the way to your goals.
              </p>
            </div>
          )}

          {/* Streak Insights */}
          {streak && streak.currentStreak >= 4 && (
            <div className="flex items-start gap-2">
              <span className="text-orange-600">🔥</span>
              <p>
                <span className="font-bold">Keep the momentum!</span> You've maintained a{" "}
                {streak.currentStreak}-week streak.
              </p>
            </div>
          )}

          {/* Velocity Insights */}
          {velocity.consistency < 50 && (
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <p>
                <span className="font-bold">Try automated transfers.</span> Your consistency is{" "}
                {velocity.consistency}% - set up weekly auto-saves to improve.
              </p>
            </div>
          )}

          {/* Risk Warnings */}
          {atRiskGoals.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-red-600">⚠️</span>
              <p>
                <span className="font-bold">{atRiskGoals.length} goal(s) behind schedule.</span> Review
                your target dates or increase contributions.
              </p>
            </div>
          )}

          {/* No goals reminder */}
          {goals.length === 0 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-600">🎯</span>
              <p>
                <span className="font-bold">Start your savings journey!</span> Create your first goal to
                track progress and stay motivated.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
