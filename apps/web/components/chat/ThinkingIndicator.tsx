"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface ThinkingIndicatorProps {
  thoughts?: string[];
  isThinking: boolean;
}

export function ThinkingIndicator({
  thoughts = [],
  isThinking,
}: ThinkingIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isThinking && thoughts.length === 0) return null;

  return (
    <div className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-purple-700 w-full text-left"
      >
        {isThinking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Brain className="w-4 h-4" />
        )}
        <span>
          {isThinking
            ? "Thinking..."
            : `Thought process (${thoughts.length} steps)`}
        </span>
        {thoughts.length > 0 && (
          <span className="ml-auto">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        )}
      </button>

      {expanded && thoughts.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {thoughts.map((thought, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-purple-400 font-mono">{idx + 1}.</span>
              <span>{thought}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface AgentThinkingProps {
  agentName?: string;
}

export function AgentThinking({ agentName = "TRIBE" }: AgentThinkingProps) {
  return (
    <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
      <span>{agentName} is thinking...</span>
    </div>
  );
}
