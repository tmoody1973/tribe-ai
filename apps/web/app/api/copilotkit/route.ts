import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
} from "@copilotkit/runtime";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { classifyQuery } from "@/lib/queryClassifier";

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
      name: "searchRealtimeInfo",
      description:
        "Search for current, real-time information about visa processing times, policy changes, embassy appointments, and other time-sensitive migration topics. Use this when the user asks about current status, processing times, recent policy changes, or anything that requires up-to-date information. This searches the web for the latest information.",
      parameters: [
        {
          name: "query",
          type: "string",
          description: "The search query for real-time information",
          required: true,
        },
        {
          name: "corridorId",
          type: "string",
          description: "The corridor ID for context (optional)",
          required: false,
        },
        {
          name: "userId",
          type: "string",
          description: "The user ID for rate limiting",
          required: true,
        },
      ],
      handler: async ({
        query,
        corridorId,
        userId,
      }: {
        query: string;
        corridorId?: string;
        userId: string;
      }) => {
        try {
          const startTime = Date.now();

          // Classify the query to check if it needs real-time info
          const classification = classifyQuery(query);

          // If not a real-time query, suggest using searchMigrationKnowledge instead
          if (!classification.isRealtime && !classification.isPolicyRelated) {
            return {
              message:
                "This query doesn't appear to need real-time information. Consider using the searchMigrationKnowledge tool for community experiences.",
              classification,
              usedPerplexity: false,
            };
          }

          // Call Perplexity for real-time search
          const result = await convex.action(api.ai.perplexity.searchRealtime, {
            query,
            corridorId: corridorId as Id<"corridors"> | undefined,
            userId,
          });

          const latencyMs = Date.now() - startTime;

          if (result.rateLimited) {
            return {
              message:
                "You've reached the limit for real-time searches (10 per hour). Please try again later or use the community knowledge base.",
              rateLimited: true,
              remainingRequests: 0,
            };
          }

          console.log(
            `Real-time search completed in ${latencyMs}ms, ${result.sources.length} sources`
          );

          return {
            message: `Found real-time information from ${result.sources.length} web sources.`,
            answer: result.answer,
            sources: result.sources,
            classification,
            usedPerplexity: true,
            remainingRequests: result.remainingRequests,
          };
        } catch (error) {
          console.error("Real-time search error:", error);
          return {
            message:
              "Sorry, I encountered an error searching for real-time information. Please try the community knowledge base instead.",
            error: error instanceof Error ? error.message : "Unknown error",
            usedPerplexity: false,
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
