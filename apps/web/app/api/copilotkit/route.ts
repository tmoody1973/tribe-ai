import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";

// Simple CopilotKit runtime - no custom actions to avoid ZodError
// The AI can still answer questions about migration using its training data
const runtime = new CopilotRuntime();

// Use Google Gemini 2.5 Flash as the LLM provider
const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-2.5-flash",
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
