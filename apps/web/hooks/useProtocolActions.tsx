"use client";

import { Id } from "@/convex/_generated/dataModel";

/**
 * Protocol Actions Hook
 *
 * NOTE: CopilotKit actions have been disabled to fix state patch errors.
 * The GoogleGenerativeAIAdapter attempts to sync state via JSON Patch,
 * but without a CoAgent backend, these patches fail.
 *
 * To re-enable generative protocol cards in the future:
 * 1. Set up a proper CoAgent backend (LangGraph, CrewAI, etc.)
 * 2. Define agent state that includes migrationProtocols array
 * 3. Use useCoAgent hook with initialState
 *
 * For now, protocols are displayed statically from Convex.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useProtocolActions(_corridorId: Id<"corridors">, _stage: string) {
  // Actions disabled - see comment above
  // Static protocols from Convex are used instead
}
