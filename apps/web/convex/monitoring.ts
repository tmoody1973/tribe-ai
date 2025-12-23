import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log token usage for cost monitoring and analytics
 */
export const logTokenUsage = mutation({
  args: {
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    action: v.string(),
    corridorId: v.optional(v.id("corridors")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("tokenUsage", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get token usage summary with optional date filtering
 */
export const getTokenUsageSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const logs = await ctx.db.query("tokenUsage").collect();

    const filtered = logs.filter((log) => {
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      return true;
    });

    const summary = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      byAction: {} as Record<
        string,
        { input: number; output: number; count: number }
      >,
      byModel: {} as Record<
        string,
        { input: number; output: number; count: number }
      >,
    };

    for (const log of filtered) {
      summary.totalInputTokens += log.inputTokens;
      summary.totalOutputTokens += log.outputTokens;

      // Group by action
      if (!summary.byAction[log.action]) {
        summary.byAction[log.action] = { input: 0, output: 0, count: 0 };
      }
      summary.byAction[log.action].input += log.inputTokens;
      summary.byAction[log.action].output += log.outputTokens;
      summary.byAction[log.action].count += 1;

      // Group by model
      if (!summary.byModel[log.model]) {
        summary.byModel[log.model] = { input: 0, output: 0, count: 0 };
      }
      summary.byModel[log.model].input += log.inputTokens;
      summary.byModel[log.model].output += log.outputTokens;
      summary.byModel[log.model].count += 1;
    }

    return summary;
  },
});

/**
 * Get recent token usage logs for debugging
 */
export const getRecentUsage = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db
      .query("tokenUsage")
      .order("desc")
      .take(limit);
  },
});
