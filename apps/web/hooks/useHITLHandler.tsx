"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core";
import { ActionApprovalCard } from "@/components/chat/ActionApprovalCard";
import {
  getHITLAction,
  getImpactDescription,
  type RiskLevel,
} from "@/lib/constants/hitl-actions";

/**
 * Hook to handle Human-in-the-Loop approvals for agent actions.
 *
 * This hook integrates with CopilotKit's useHumanInTheLoop to render
 * approval UI for actions that require user confirmation.
 *
 * Usage: Call this hook once in your chat component to enable HITL handling.
 */
export function useHITLHandler() {
  // Handler for create_corridor action
  useHumanInTheLoop({
    name: "create_corridor",
    description: "Create a new migration corridor",
    render: (props) => {
      const action = getHITLAction("create_corridor");
      const args = props.args as Record<string, unknown>;
      const origin = (args.origin as string) || "Unknown";
      const destination = (args.destination as string) || "Unknown";

      // Only show approval UI when executing (waiting for response)
      if (props.status !== "executing") {
        return (
          <div className="text-sm text-gray-500 italic p-2">
            {props.status === "complete" ? "Action completed" : "Processing..."}
          </div>
        );
      }

      return (
        <ActionApprovalCard
          action="create_corridor"
          description={`Create new corridor: ${origin} → ${destination}`}
          impact={action?.impact as string || "This will add a new corridor to your dashboard."}
          riskLevel={(action?.riskLevel as RiskLevel) || "high"}
          timeoutSeconds={60}
          onApprove={() => props.respond?.({ approved: true })}
          onReject={(reason) => props.respond?.({ approved: false, reason })}
        />
      );
    },
  });

  // Handler for refresh_protocols action
  useHumanInTheLoop({
    name: "refresh_protocols",
    description: "Regenerate all protocols for the current corridor",
    render: (props) => {
      const action = getHITLAction("refresh_protocols");

      if (props.status !== "executing") {
        return (
          <div className="text-sm text-gray-500 italic p-2">
            {props.status === "complete" ? "Protocols refreshed" : "Processing..."}
          </div>
        );
      }

      return (
        <ActionApprovalCard
          action="refresh_protocols"
          description="Regenerate all protocols for your corridor"
          impact={action?.impact as string || "Replaces existing protocols with AI-generated ones."}
          riskLevel={(action?.riskLevel as RiskLevel) || "medium"}
          timeoutSeconds={60}
          onApprove={() => props.respond?.({ approved: true })}
          onReject={(reason) => props.respond?.({ approved: false, reason })}
        />
      );
    },
  });

  // Handler for bulk_import_expenses action
  useHumanInTheLoop({
    name: "bulk_import_expenses",
    description: "Import multiple expenses from a file",
    render: (props) => {
      const action = getHITLAction("bulk_import_expenses");
      const args = props.args as Record<string, unknown>;
      const count = (args.count as number) || 0;
      const impact = getImpactDescription("bulk_import_expenses", count);

      if (props.status !== "executing") {
        return (
          <div className="text-sm text-gray-500 italic p-2">
            {props.status === "complete" ? `Imported ${count} expenses` : "Processing..."}
          </div>
        );
      }

      return (
        <ActionApprovalCard
          action="bulk_import_expenses"
          description={`Import ${count} expense records`}
          impact={impact}
          riskLevel={(action?.riskLevel as RiskLevel) || "medium"}
          timeoutSeconds={60}
          onApprove={() => props.respond?.({ approved: true })}
          onReject={(reason) => props.respond?.({ approved: false, reason })}
        />
      );
    },
  });

  // Handler for delete_corridor action
  useHumanInTheLoop({
    name: "delete_corridor",
    description: "Delete a migration corridor and all its data",
    render: (props) => {
      const action = getHITLAction("delete_corridor");
      const args = props.args as Record<string, unknown>;
      const corridorName = (args.corridor_name as string) || "this corridor";

      if (props.status !== "executing") {
        return (
          <div className="text-sm text-gray-500 italic p-2">
            {props.status === "complete" ? "Corridor deleted" : "Processing..."}
          </div>
        );
      }

      return (
        <ActionApprovalCard
          action="delete_corridor"
          description={`Delete ${corridorName}`}
          impact={action?.impact as string || "Permanently removes corridor and all associated data."}
          riskLevel="high"
          timeoutSeconds={60}
          onApprove={() => props.respond?.({ approved: true })}
          onReject={(reason) => props.respond?.({ approved: false, reason })}
        />
      );
    },
  });
}
