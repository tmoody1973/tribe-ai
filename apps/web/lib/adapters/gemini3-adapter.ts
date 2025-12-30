/**
 * Custom CopilotKit Adapter for Google Gemini 3 Flash
 *
 * Uses the new @google/genai SDK with thinkingConfig support
 * Based on the OpenAI adapter pattern from CopilotKit
 */
import {
  CopilotServiceAdapter,
  CopilotRuntimeChatCompletionRequest,
  CopilotRuntimeChatCompletionResponse,
} from "@copilotkit/runtime";
import { randomUUID } from "crypto";

const DEFAULT_MODEL = "gemini-3-flash-preview";

export interface Gemini3AdapterParams {
  apiKey?: string;
  model?: string;
  /**
   * Thinking level: "minimal" | "low" | "medium" | "high"
   * Use "minimal" to reduce latency (closest to disabled)
   */
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}

export class Gemini3Adapter implements CopilotServiceAdapter {
  public model: string = DEFAULT_MODEL;
  public provider = "google";
  private apiKey: string;
  private thinkingLevel: string;

  public get name() {
    return "Gemini3Adapter";
  }

  constructor(params?: Gemini3AdapterParams) {
    this.apiKey = params?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    this.model = params?.model || DEFAULT_MODEL;
    this.thinkingLevel = params?.thinkingLevel || "minimal";

    if (!this.apiKey) {
      console.warn("Gemini3Adapter: No API key provided. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY");
    }
  }

  async process(
    request: CopilotRuntimeChatCompletionRequest
  ): Promise<CopilotRuntimeChatCompletionResponse> {
    const {
      threadId: threadIdFromRequest,
      model = this.model,
      messages,
      actions,
      eventSource,
    } = request;

    const threadId = threadIdFromRequest ?? randomUUID();

    // Lazy import @google/genai
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: this.apiKey,
    });

    // Convert CopilotKit messages to Gemini format
    const contents = this.convertMessages(messages);

    // Convert actions to Gemini tools format
    const tools = this.convertActionsToTools(actions);

    const config: any = {
      thinkingConfig: {
        thinkingLevel: this.thinkingLevel.toUpperCase(),
      },
    };

    if (tools.length > 0) {
      config.tools = [{ functionDeclarations: tools }];
    }

    try {
      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      eventSource.stream(async (eventStream$) => {
        let currentMessageId = randomUUID();
        let mode: "message" | "function" | null = null;
        let currentToolCallId: string | null = null;

        try {
          for await (const chunk of response) {
            // Handle text content
            const text = chunk.text;
            if (text) {
              if (mode !== "message") {
                if (mode === "function" && currentToolCallId) {
                  eventStream$.sendActionExecutionEnd({ actionExecutionId: currentToolCallId });
                }
                mode = "message";
                currentMessageId = randomUUID();
                eventStream$.sendTextMessageStart({ messageId: currentMessageId });
              }
              eventStream$.sendTextMessageContent({
                messageId: currentMessageId,
                content: text,
              });
            }

            // Handle function calls
            const functionCalls = chunk.candidates?.[0]?.content?.parts?.filter(
              (part: any) => part.functionCall
            );

            if (functionCalls && functionCalls.length > 0) {
              for (const part of functionCalls) {
                const functionCall = part.functionCall;
                if (functionCall) {
                  if (mode === "message") {
                    eventStream$.sendTextMessageEnd({ messageId: currentMessageId });
                  }
                  if (mode === "function" && currentToolCallId) {
                    eventStream$.sendActionExecutionEnd({ actionExecutionId: currentToolCallId });
                  }

                  mode = "function";
                  currentToolCallId = randomUUID();
                  eventStream$.sendActionExecutionStart({
                    actionExecutionId: currentToolCallId,
                    actionName: functionCall.name || "unknown",
                    parentMessageId: currentMessageId,
                  });
                  eventStream$.sendActionExecutionArgs({
                    actionExecutionId: currentToolCallId,
                    args: JSON.stringify(functionCall.args || {}),
                  });
                }
              }
            }
          }

          // Close any open streams
          if (mode === "message") {
            eventStream$.sendTextMessageEnd({ messageId: currentMessageId });
          } else if (mode === "function" && currentToolCallId) {
            eventStream$.sendActionExecutionEnd({ actionExecutionId: currentToolCallId });
          }
        } catch (streamError) {
          console.error("[Gemini3Adapter] Stream error:", streamError);
          // Send error as message
          if (mode !== "message") {
            eventStream$.sendTextMessageStart({ messageId: randomUUID() });
          }
          eventStream$.sendTextMessageContent({
            messageId: currentMessageId,
            content: `Error: ${String(streamError)}`,
          });
          eventStream$.sendTextMessageEnd({ messageId: currentMessageId });
        }

        eventStream$.complete();
      });
    } catch (error) {
      console.error("[Gemini3Adapter] Error:", error);
      throw error;
    }

    return { threadId };
  }

  private convertMessages(messages: any[]): any[] {
    const contents: any[] = [];

    for (const message of messages) {
      if (message.isTextMessage?.()) {
        contents.push({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        });
      } else if (message.isSystemMessage?.()) {
        // Gemini handles system messages differently - prepend to first user message
        contents.push({
          role: "user",
          parts: [{ text: `System: ${message.content}` }],
        });
      } else if (message.isActionExecutionMessage?.()) {
        contents.push({
          role: "model",
          parts: [{
            functionCall: {
              name: message.name,
              args: JSON.parse(message.arguments || "{}"),
            },
          }],
        });
      } else if (message.isResultMessage?.()) {
        contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: message.actionName || "function",
              response: { result: message.result },
            },
          }],
        });
      }
    }

    return contents;
  }

  private convertActionsToTools(actions: any[]): any[] {
    return actions.map((action) => ({
      name: action.name,
      description: action.description,
      parameters: action.parameters || { type: "object", properties: {} },
    }));
  }
}
