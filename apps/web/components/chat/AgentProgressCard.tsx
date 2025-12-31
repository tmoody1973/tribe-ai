"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AgentState {
  step?: number;
  total_steps?: number;
  message?: string;
  progress?: number;
}

interface AgentProgressCardProps {
  state: AgentState;
}

export function AgentProgressCard({ state }: AgentProgressCardProps) {
  const [dots, setDots] = useState("");

  // Animate dots for loading effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.round((state.progress || 0) * 100);
  const step = state.step || 1;
  const totalSteps = state.total_steps || 1;
  const message = state.message || "Processing...";

  return (
    <div className="border-2 border-black p-4 bg-blue-50 shadow-[2px_2px_0_0_#000]">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="font-bold">
          Step {step} of {totalSteps}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3">
        {message}
        {dots}
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 border border-black overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-right">{progressPercent}%</div>
    </div>
  );
}

interface SimpleProgressProps {
  message: string;
}

export function SimpleProgress({ message }: SimpleProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border-2 border-black">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      <span className="text-sm text-gray-700">
        {message}
        {dots}
      </span>
    </div>
  );
}
