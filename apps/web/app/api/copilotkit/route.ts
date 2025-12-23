import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";

// Initialize CopilotKit runtime with Gemini
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "generateProtocols",
      description: "Generate personalized migration protocols for the user's corridor",
      parameters: [
        { name: "origin", type: "string", description: "Origin country code", required: true },
        { name: "destination", type: "string", description: "Destination country code", required: true },
        { name: "stage", type: "string", description: "User's migration stage", required: true },
      ],
      handler: async ({ origin, destination, stage }) => {
        // This will be handled by the LLM with the tool calls
        return {
          message: `Generating protocols for ${origin} to ${destination} (${stage} stage)`,
        };
      },
    },
  ],
});

// Use Google Gemini as the LLM provider
const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-3-flash-preview",
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
