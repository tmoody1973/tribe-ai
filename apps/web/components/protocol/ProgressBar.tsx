"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Your Progress</span>
        <span className="text-sm text-gray-600">
          {completed} / {total} completed
        </span>
      </div>

      <div className="h-6 bg-gray-200 border-2 border-black overflow-hidden">
        <motion.div
          className="h-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="text-center mt-2 font-bold text-lg">
        {percentage}%
      </div>
    </div>
  );
}
