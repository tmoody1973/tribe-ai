"use client";

import { useCoAgent, useCoAgentStateRender } from "@copilotkit/react-core";
import { AgentProgressCard } from "@/components/chat/AgentProgressCard";
import { AgentThinking } from "@/components/chat/ThinkingIndicator";

interface AgentState {
  step?: number;
  total_steps?: number;
  message?: string;
  progress?: number;
}

/**
 * Hook to integrate agent progress rendering in the chat.
 *
 * This hook:
 * 1. Subscribes to the tribe_agent's state using useCoAgent
 * 2. Renders progress updates inline in the chat using useCoAgentStateRender
 *
 * Usage: Call this hook once in your chat component to enable progress rendering.
 */
export function useAgentProgress() {
  // Subscribe to agent state
  const { state: agentState, running } = useCoAgent<AgentState>({
    name: "tribe_agent",
  });

  // Render state updates in chat flow
  useCoAgentStateRender({
    name: "tribe_agent",
    render: ({ state }) => {
      // If no state or no step info, show simple thinking indicator
      if (!state || typeof state !== "object") {
        return <AgentThinking />;
      }

      const typedState = state as AgentState;

      // If we have step info, show detailed progress
      if (typedState.step && typedState.message) {
        return <AgentProgressCard state={typedState} />;
      }

      // Otherwise show simple thinking indicator
      return <AgentThinking />;
    },
  });

  return {
    agentState,
    isRunning: running,
  };
}
