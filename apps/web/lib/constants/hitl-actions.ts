/**
 * Human-in-the-Loop (HITL) Action Definitions
 *
 * These constants define which agent actions require user approval
 * before execution.
 */

export type RiskLevel = "high" | "medium" | "low";

export interface HITLActionConfig {
  name: string;
  description: string;
  riskLevel: RiskLevel;
  impact: string | ((param: number) => string);
  requiresApproval: boolean | ((param: number) => boolean);
}

export const HITL_ACTIONS = {
  // High risk - always require approval
  CREATE_CORRIDOR: {
    name: "create_corridor",
    description: "Create a new migration corridor",
    riskLevel: "high" as RiskLevel,
    impact: "Adds a new corridor to your dashboard",
    requiresApproval: true,
  },
  DELETE_CORRIDOR: {
    name: "delete_corridor",
    description: "Delete a migration corridor",
    riskLevel: "high" as RiskLevel,
    impact: "Permanently removes corridor and all associated data",
    requiresApproval: true,
  },
  REFRESH_PROTOCOLS: {
    name: "refresh_protocols",
    description: "Regenerate all protocols for corridor",
    riskLevel: "medium" as RiskLevel,
    impact: "Replaces existing protocols with AI-generated ones",
    requiresApproval: true,
  },

  // Medium risk - approval recommended
  BULK_IMPORT: {
    name: "bulk_import_expenses",
    description: "Import multiple expenses from CSV",
    riskLevel: "medium" as RiskLevel,
    impact: (count: number) => `Adds ${count} new expense records`,
    requiresApproval: (count: number) => count > 50,
  },
  UPDATE_STAGE: {
    name: "update_stage",
    description: "Update migration stage",
    riskLevel: "medium" as RiskLevel,
    impact: "Changes your current migration stage and may update protocols",
    requiresApproval: true,
  },

  // Low risk - optional approval
  ADD_TODO: {
    name: "add_todo",
    description: "Add item to your task list",
    riskLevel: "low" as RiskLevel,
    impact: "Adds a new task to your todo list",
    requiresApproval: false,
  },
  SAVE_DOCUMENT: {
    name: "save_document",
    description: "Save a resource to your vault",
    riskLevel: "low" as RiskLevel,
    impact: "Saves the resource for later reference",
    requiresApproval: false,
  },
} as const;

/**
 * Get HITL action config by name
 */
export function getHITLAction(actionName: string): HITLActionConfig | undefined {
  return Object.values(HITL_ACTIONS).find((a) => a.name === actionName) as
    | HITLActionConfig
    | undefined;
}

/**
 * Check if an action requires approval
 */
export function requiresApproval(
  actionName: string,
  param?: number
): boolean {
  const action = getHITLAction(actionName);
  if (!action) return false;

  if (typeof action.requiresApproval === "function") {
    return action.requiresApproval(param ?? 0);
  }

  return action.requiresApproval;
}

/**
 * Get impact description for an action
 */
export function getImpactDescription(
  actionName: string,
  param?: number
): string {
  const action = getHITLAction(actionName);
  if (!action) return "This action will modify your data.";

  if (typeof action.impact === "function") {
    return action.impact(param ?? 0);
  }

  return action.impact;
}
