"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { Id } from "@/convex/_generated/dataModel";
import { GenerativeProtocolCard } from "@/components/protocol/GenerativeProtocolCard";

interface GeneratedProtocol {
  category: "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  order: number;
  warnings?: string[];
  hacks?: string[];
  confidence?: number;
  attribution?: {
    sourceUrl: string;
    authorName?: string;
    engagement?: number;
  };
}

// Stage-based emphasis rules
function getStageEmphasis(
  stage: string,
  category: string
): "high" | "medium" | "low" {
  const emphasisMap: Record<string, string[]> = {
    dreaming: ["visa", "finance"],
    planning: ["visa", "finance", "employment"],
    preparing: ["legal", "health", "housing"],
    relocating: ["housing", "legal"],
    settling: ["social", "employment", "health"],
  };

  const highEmphasis = emphasisMap[stage] ?? [];
  if (highEmphasis.includes(category)) return "high";
  return "medium";
}

export function useProtocolActions(corridorId: Id<"corridors">, stage: string) {
  // Register action for rendering a single protocol card
  useCopilotAction({
    name: "showProtocolCard",
    description: "Display a protocol step as an interactive card",
    parameters: [
      {
        name: "protocol",
        type: "object",
        description: "The protocol step data to display",
      },
    ],
    render: ({ status, args }) => {
      if (status === "inProgress" || status === "complete") {
        const protocol = args.protocol as GeneratedProtocol;
        if (!protocol) return <></>;

        const emphasis = getStageEmphasis(stage, protocol.category);

        return (
          <GenerativeProtocolCard
            protocol={protocol}
            emphasis={emphasis}
            isStreaming={status === "inProgress"}
          />
        );
      }
      return <></>;
    },
  });

  // Register action for rendering multiple protocols
  useCopilotAction({
    name: "showProtocolList",
    description: "Display a list of protocol steps",
    parameters: [
      {
        name: "protocols",
        type: "object[]",
        description: "Array of protocol steps to display",
      },
    ],
    render: ({ status, args }) => {
      const protocols = (args.protocols as GeneratedProtocol[]) ?? [];

      return (
        <div className="space-y-4">
          {protocols.map((protocol, index) => (
            <GenerativeProtocolCard
              key={index}
              protocol={protocol}
              emphasis={getStageEmphasis(stage, protocol.category)}
              isStreaming={status === "inProgress"}
            />
          ))}
        </div>
      );
    },
  });
}
