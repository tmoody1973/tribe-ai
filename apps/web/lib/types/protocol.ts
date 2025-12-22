import type { Doc, Id } from "@/convex/_generated/dataModel";

export type Protocol = Doc<"protocols">;
export type ProtocolId = Id<"protocols">;

export type ProtocolCategory =
  | "visa"
  | "finance"
  | "housing"
  | "employment"
  | "legal"
  | "health"
  | "social";

export type ProtocolStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked";

export type ProtocolPriority = "critical" | "high" | "medium" | "low";

export const protocolCategoryLabels: Record<ProtocolCategory, string> = {
  visa: "Visa & Immigration",
  finance: "Finance & Banking",
  housing: "Housing",
  employment: "Employment",
  legal: "Legal",
  health: "Healthcare",
  social: "Social & Community",
};

export const protocolStatusLabels: Record<ProtocolStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

export const protocolPriorityLabels: Record<ProtocolPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};
