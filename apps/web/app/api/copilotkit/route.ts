import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client for RAG operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize CopilotKit runtime with Gemini and RAG actions
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "searchMigrationKnowledge",
      description:
        "Search the community knowledge base for relevant migration information. Use this tool to find answers to user questions about visa processes, relocation tips, cost of living, cultural insights, and other migration-related topics.",
      parameters: [
        {
          name: "query",
          type: "string",
          description: "The search query based on user's question",
          required: true,
        },
        {
          name: "corridorId",
          type: "string",
          description: "The corridor ID to filter results (optional)",
          required: false,
        },
      ],
      handler: async ({
        query,
        corridorId,
      }: {
        query: string;
        corridorId?: string;
      }) => {
        try {
          const startTime = Date.now();

          // Call the RAG context builder action
          const ragContext = await convex.action(api.ai.qa.buildRAGContext, {
            question: query,
            corridorId: corridorId as Id<"corridors"> | undefined,
            limit: 10,
          });

          const latencyMs = Date.now() - startTime;

          // Log token usage for monitoring (action call tracking)
          await convex.mutation(api.monitoring.logTokenUsage, {
            model: "voyage-3",
            inputTokens: query.length, // Approximate
            outputTokens: 0,
            action: "rag_search",
            corridorId: corridorId as Id<"corridors"> | undefined,
          });

          console.log(
            `RAG search completed in ${latencyMs}ms, ${ragContext.resultCount} results`
          );

          if (ragContext.resultCount === 0) {
            return {
              message:
                "No relevant community knowledge found for this query. Please try rephrasing your question or ask about a different topic.",
              sources: [],
              context: "",
            };
          }

          return {
            message: `Found ${ragContext.resultCount} relevant community experiences.`,
            context: ragContext.context,
            sources: ragContext.sources,
            corridorInfo: ragContext.corridorInfo,
          };
        } catch (error) {
          console.error("RAG search error:", error);
          return {
            message:
              "Sorry, I encountered an error searching the knowledge base. Please try again.",
            sources: [],
            context: "",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },
    {
      name: "generateProtocols",
      description:
        "Generate personalized migration protocols for the user's corridor",
      parameters: [
        {
          name: "origin",
          type: "string",
          description: "Origin country code",
          required: true,
        },
        {
          name: "destination",
          type: "string",
          description: "Destination country code",
          required: true,
        },
        {
          name: "stage",
          type: "string",
          description: "User's migration stage",
          required: true,
        },
      ],
      handler: async ({
        origin,
        destination,
        stage,
      }: {
        origin: string;
        destination: string;
        stage: string;
      }) => {
        // This will be handled by the LLM with the tool calls
        return {
          message: `Generating protocols for ${origin} to ${destination} (${stage} stage)`,
        };
      },
    },
  ],
});

// Use Google Gemini as the LLM provider with system instructions
const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-2.0-flash",
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
