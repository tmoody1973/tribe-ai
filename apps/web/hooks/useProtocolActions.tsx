"use client";

import { Id } from "@/convex/_generated/dataModel";

/**
 * Protocol Actions Hook
 *
 * Protocol generation is now handled by the ADK agent backend.
 * See agents/tribe_agent/ for implementation.
 *
 * This hook is kept for backwards compatibility but may be removed
 * once generative protocols are fully migrated to the ADK agent.
 *
 * For protocol cards in chat, the ADK agent uses tools that return
 * structured data rendered by ToolRenderer components.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useProtocolActions(_corridorId: Id<"corridors">, _stage: string) {
  // Protocol actions handled by ADK agent tools
  // Static protocols from Convex are displayed via GenerativeProtocolList
}
