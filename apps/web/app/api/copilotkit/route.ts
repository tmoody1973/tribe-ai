/**
 * CopilotKit API Route - ADK Agent Integration
 *
 * This route connects the Next.js frontend to the TRIBE ADK agent backend
 * via AG-UI protocol. The LLM processing happens in the ADK agent server,
 * so we use ExperimentalEmptyAdapter here.
 *
 * Architecture:
 * Next.js Frontend <-> CopilotRuntime <-> HttpAgent <-> ADK Agent Server <-> Gemini
 */

import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

// ADK Agent URL - defaults to local development server
const ADK_AGENT_URL = process.env.ADK_AGENT_URL || "http://localhost:8000/agui";

// Create HttpAgent to connect to ADK backend via AG-UI protocol
const tribeAgent = new HttpAgent({
  url: ADK_AGENT_URL,
});

// CopilotRuntime with ADK agent
// Actions are handled by ADK agent tools, not inline here
const runtime = new CopilotRuntime({
  agents: {
    tribe_agent: tribeAgent,
  },
});

// Empty adapter since LLM is handled by ADK agent
const serviceAdapter = new ExperimentalEmptyAdapter();

// Log configuration for debugging
console.log("CopilotKit route initialized with ADK integration");
console.log("ADK_AGENT_URL:", ADK_AGENT_URL);

export const POST = async (req: Request) => {
  try {
    console.log("CopilotKit POST request received");

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(req);
    console.log("CopilotKit response status:", response.status);
    return response;
  } catch (error) {
    console.error("CopilotKit POST error:", error);

    // Provide detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        hint: "Check that the ADK agent server is running at " + ADK_AGENT_URL,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
