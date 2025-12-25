"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Rocket, Target, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface ProgressBarProps {
  completed: number;
  total: number;
  corridorOrigin?: string;
  corridorDestination?: string;
}

export function ProgressBar({ completed, total, corridorOrigin, corridorDestination }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(completed);

  // Celebrate when progress increases
  useEffect(() => {
    if (completed > prevCompleted && completed > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    setPrevCompleted(completed);
  }, [completed, prevCompleted]);

  // Estimate days remaining (rough calculation: 2-3 days per step)
  const stepsRemaining = total - completed;
  const estimatedDaysMin = stepsRemaining * 2;
  const estimatedDaysMax = stepsRemaining * 5;

  // Get milestone message
  const getMilestoneMessage = () => {
    if (percentage === 100) return "Journey Complete! 🎉";
    if (percentage >= 75) return "Almost there! Final stretch!";
    if (percentage >= 50) return "Halfway through your journey!";
    if (percentage >= 25) return "Great progress! Keep going!";
    if (completed > 0) return "You've started your journey!";
    return "Begin your migration journey";
  };

  // Get progress color based on percentage
  const getProgressColor = () => {
    if (percentage >= 75) return "from-green-400 to-green-600";
    if (percentage >= 50) return "from-yellow-400 to-green-500";
    if (percentage >= 25) return "from-orange-400 to-yellow-500";
    return "from-blue-400 to-blue-600";
  };

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden">
      {/* Header with corridor info */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket size={24} />
            <div>
              <h3 className="font-bold text-lg">Your Migration Journey</h3>
              {corridorOrigin && corridorDestination && (
                <p className="text-sm text-white/80">
                  {corridorOrigin} → {corridorDestination}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{percentage}%</div>
            <div className="text-xs text-white/80">complete</div>
          </div>
        </div>
      </div>

      {/* Progress visualization */}
      <div className="p-4">
        {/* Progress bar */}
        <div className="relative h-8 bg-gray-100 border-2 border-black rounded-sm overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getProgressColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="relative"
                style={{ left: `${milestone}%`, transform: "translateX(-50%)" }}
              >
                <div
                  className={`absolute top-0 bottom-0 w-0.5 ${
                    percentage >= milestone ? "bg-white/50" : "bg-gray-300"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Completion indicator */}
          {percentage === 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Trophy size={20} className="text-yellow-500" />
            </motion.div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Target size={16} className="text-green-600" />
              <span className="font-bold text-green-600">{completed}</span>
              <span className="text-gray-500">done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-600">{stepsRemaining}</span>
              <span className="text-gray-500">remaining</span>
            </div>
          </div>

          {stepsRemaining > 0 && (
            <div className="text-gray-500 text-xs">
              Est. {estimatedDaysMin}-{estimatedDaysMax} days to complete
            </div>
          )}
        </div>

        {/* Milestone message */}
        <div className="mt-3 text-center">
          <motion.p
            key={getMilestoneMessage()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-gray-700"
          >
            {getMilestoneMessage()}
          </motion.p>
        </div>
      </div>

      {/* Celebration effect */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={48} className="text-yellow-500" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
