"use client";

import { Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface GenericToolCardProps {
  name: string;
  result: unknown;
}

export function GenericToolCard({ name, result }: GenericToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Format the tool name for display (snake_case to Title Case)
  const formatToolName = (toolName: string) => {
    return toolName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check if result has an error
  const hasError = result && typeof result === "object" && "error" in result;
  const bgColor = hasError ? "bg-red-50" : "bg-gray-100";

  return (
    <div className={`border-2 border-black p-4 ${bgColor} shadow-[2px_2px_0_0_#000]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          <span className="font-bold text-sm">{formatToolName(name)}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-black"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Details
            </>
          )}
        </button>
      </div>

      {/* Quick summary */}
      {result && typeof result === "object" && "success" in result ? (
        <p className="text-sm mb-2">
          {(result as { success: boolean }).success ? (
            <span className="text-green-700">Completed successfully</span>
          ) : (
            <span className="text-red-700">Completed with issues</span>
          )}
        </p>
      ) : null}

      {/* Expanded details */}
      {expanded && (
        <pre className="text-xs bg-white p-2 border border-gray-300 overflow-auto max-h-40 mt-2">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

interface GenericToolLoadingProps {
  name: string;
}

export function GenericToolLoading({ name }: GenericToolLoadingProps) {
  const formatToolName = (toolName: string) => {
    return toolName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="border-2 border-black p-4 bg-gray-50 flex items-center gap-3">
      <div className="relative">
        <Wrench className="w-5 h-5" />
        <div className="w-3 h-3 absolute -bottom-1 -right-1 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
      <span className="font-medium">Running {formatToolName(name)}...</span>
    </div>
  );
}
