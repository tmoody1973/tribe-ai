"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Check, X, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RiskLevel } from "@/lib/constants/hitl-actions";

interface ActionApprovalCardProps {
  action: string;
  description: string;
  impact: string;
  riskLevel: RiskLevel;
  timeoutSeconds?: number;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}

const riskColors = {
  high: "bg-red-100 border-red-500",
  medium: "bg-yellow-100 border-yellow-500",
  low: "bg-blue-100 border-blue-500",
};

const riskIcons = {
  high: ShieldAlert,
  medium: AlertTriangle,
  low: ShieldCheck,
};

export function ActionApprovalCard({
  action,
  description,
  impact,
  riskLevel,
  timeoutSeconds = 60,
  onApprove,
  onReject,
}: ActionApprovalCardProps) {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [isProcessing, setIsProcessing] = useState(false);

  const RiskIcon = riskIcons[riskLevel];

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onReject("Request timed out");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  const handleApprove = () => {
    setIsProcessing(true);
    onApprove();
  };

  const handleReject = () => {
    setIsProcessing(true);
    onReject("User cancelled");
  };

  return (
    <div
      className={`border-4 border-black p-4 ${riskColors[riskLevel]} shadow-[4px_4px_0_0_#000]`}
    >
      <div className="flex items-center gap-2 mb-3">
        <RiskIcon className="w-5 h-5" />
        <h3 className="font-bold text-lg">Action Requires Approval</h3>
        <span className="ml-auto flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {timeLeft}s
        </span>
      </div>

      <div className="bg-white border-2 border-black p-3 mb-3">
        <p className="font-bold">{description}</p>
        <p className="text-sm text-gray-600 mt-1">{impact}</p>
        <p className="text-xs text-gray-400 mt-2 font-mono">Action: {action}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 py-2 border-2 border-black bg-green-300 hover:bg-green-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 py-2 border-2 border-black bg-red-300 hover:bg-red-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      {riskLevel === "high" && (
        <p className="text-xs text-red-600 mt-2 text-center font-medium">
          This action cannot be undone
        </p>
      )}

      {/* Progress bar for timeout */}
      <div className="mt-3 h-1 bg-gray-200 border border-black overflow-hidden">
        <div
          className="h-full bg-gray-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / timeoutSeconds) * 100}%` }}
        />
      </div>
    </div>
  );
}

interface ApprovalResultCardProps {
  action: string;
  approved: boolean;
  reason?: string;
}

export function ApprovalResultCard({
  action,
  approved,
  reason,
}: ApprovalResultCardProps) {
  return (
    <div
      className={`border-2 border-black p-3 ${
        approved ? "bg-green-100" : "bg-red-100"
      }`}
    >
      <div className="flex items-center gap-2">
        {approved ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <X className="w-4 h-4 text-red-600" />
        )}
        <span className="font-medium">
          {approved ? "Action approved" : "Action cancelled"}
        </span>
      </div>
      {reason && <p className="text-xs text-gray-600 mt-1">{reason}</p>}
    </div>
  );
}
