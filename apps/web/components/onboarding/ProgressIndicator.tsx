"use client";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-3 w-3 border-2 border-black transition-colors ${
            i < currentStep ? "bg-black" : "bg-white"
          }`}
        />
      ))}
    </div>
  );
}
