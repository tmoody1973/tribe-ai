import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Rate Limit Middleware for CopilotKit Actions
 *
 * Checks rate limits before executing expensive operations
 * Returns graceful error messages when limits are exceeded
 */

type ActionType =
  | "chat_message"
  | "fireplexity_search"
  | "visa_discovery"
  | "processing_times"
  | "static_search";

interface RateLimitResult {
  allowed: boolean;
  message?: string;
  remaining?: number;
  limit?: number;
  resetAt?: number;
}

export async function checkActionRateLimit(
  convex: ConvexHttpClient,
  userId: Id<"users">,
  action: ActionType
): Promise<RateLimitResult> {
  try {
    const status = await convex.query(api.rateLimit.checkRateLimit, {
      userId,
      action,
    });

    if (!status.allowed) {
      const resetDate = new Date(status.resetAt);
      const hoursUntilReset = Math.ceil((status.resetAt - Date.now()) / (1000 * 60 * 60));

      return {
        allowed: false,
        message: `⚠️ Daily limit exceeded (${status.used}/${status.limit} used). ${
          status.gracefulFallback
            ? "Showing cached data. "
            : ""
        }Limit resets in ${hoursUntilReset} hours at ${resetDate.toLocaleTimeString()} UTC.`,
        remaining: 0,
        limit: status.limit,
        resetAt: status.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: status.remaining,
      limit: status.limit,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On error, allow the action (fail open)
    return { allowed: true };
  }
}

export async function incrementActionRateLimit(
  convex: ConvexHttpClient,
  userId: Id<"users">,
  action: ActionType
): Promise<void> {
  try {
    await convex.mutation(api.rateLimit.incrementRateLimit, {
      userId,
      action,
    });
  } catch (error) {
    console.error("Rate limit increment failed:", error);
    // Continue anyway
  }
}

/**
 * Helper to format rate limit errors for user display
 */
export function formatRateLimitError(action: ActionType, status: RateLimitResult): string {
  const actionNames: Record<ActionType, string> = {
    chat_message: "Chat messages",
    fireplexity_search: "Live web searches",
    visa_discovery: "Visa requirement queries",
    processing_times: "Processing time lookups",
    static_search: "Static searches",
  };

  return status.message || `${actionNames[action]} rate limit exceeded. Please try again later.`;
}
