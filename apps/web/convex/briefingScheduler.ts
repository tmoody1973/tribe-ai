"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Daily Briefing Generation (Story 9.10)
 * Runs hourly to generate briefings for users based on their timezone
 * Generates 2-3 minute briefings with 7 sections
 */
export const generateDailyBriefings = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();

    // Get all active corridors that need daily briefings
    const corridors = await ctx.runQuery(internal.briefingQueries.getActiveCorridors);

    let generated = 0;
    let skipped = 0;
    let errors = 0;

    for (const corridor of corridors) {
      try {
        // Check if user wants daily briefings (default: true)
        const userPrefs = await ctx.runQuery(internal.briefingQueries.getUserPreferences, {
          userId: corridor.userId,
        });

        if (userPrefs?.disableDailyBriefings) {
          skipped++;
          continue;
        }

        // Check user's timezone and determine if it's their briefing time (6 AM)
        const userTimezone = userPrefs?.timezone || "UTC";
        const userHour = new Date().toLocaleString("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: userTimezone,
        });

        // Generate briefing at 6 AM user time
        if (parseInt(userHour) !== 6) {
          continue; // Not their briefing time yet
        }

        // Check if briefing already generated today
        const existingBriefing = await ctx.runQuery(
          internal.briefingQueries.getTodaysBriefing,
          {
            userId: corridor.userId,
            corridorId: corridor._id,
            type: "daily",
          }
        );

        if (existingBriefing) {
          skipped++;
          continue;
        }

        // Generate the briefing
        await ctx.runAction(internal.ai.briefings.generateBriefingScript, {
          corridorId: corridor._id,
          type: "daily",
          forceRegenerate: false,
        });

        generated++;
      } catch (error) {
        console.error(`Error generating daily briefing for corridor ${corridor._id}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `Daily briefing cron completed in ${duration}ms: ${generated} generated, ${skipped} skipped, ${errors} errors`
    );

    // Log metrics
    await ctx.runMutation(internal.briefingQueries.logCronRun, {
      type: "daily",
      generated,
      skipped,
      errors,
      durationMs: duration,
    });
  },
});

/**
 * Weekly Briefing Generation (Story 9.11)
 * Runs Sunday evening to generate 5-7 minute weekly summaries
 * Includes week-over-week trend analysis and comparative insights
 */
export const generateWeeklyBriefings = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();

    // Get all active corridors that need weekly briefings
    const corridors = await ctx.runQuery(internal.briefingQueries.getActiveCorridors);

    let generated = 0;
    let skipped = 0;
    let errors = 0;

    for (const corridor of corridors) {
      try {
        // Check if user wants weekly briefings (default: true)
        const userPrefs = await ctx.runQuery(internal.briefingQueries.getUserPreferences, {
          userId: corridor.userId,
        });

        if (userPrefs?.disableWeeklyBriefings) {
          skipped++;
          continue;
        }

        // Check user's timezone and determine if it's their briefing time (7 PM Sunday)
        const userTimezone = userPrefs?.timezone || "UTC";
        const userDateTime = new Date().toLocaleString("en-US", {
          hour: "numeric",
          hour12: false,
          weekday: "long",
          timeZone: userTimezone,
        });

        const userHour = parseInt(userDateTime.split(",")[1]?.trim() || "0");
        const userDay = userDateTime.split(",")[0];

        // Generate briefing at 7 PM Sunday user time
        if (userDay !== "Sunday" || userHour !== 19) {
          continue; // Not their briefing time yet
        }

        // Check if briefing already generated this week
        const existingBriefing = await ctx.runQuery(
          internal.briefingQueries.getThisWeeksBriefing,
          {
            userId: corridor.userId,
            corridorId: corridor._id,
            type: "weekly",
          }
        );

        if (existingBriefing) {
          skipped++;
          continue;
        }

        // Generate the weekly briefing
        await ctx.runAction(internal.ai.briefings.generateBriefingScript, {
          corridorId: corridor._id,
          type: "weekly",
          forceRegenerate: false,
        });

        generated++;

        // Send email summary if user opted in
        if (userPrefs?.weeklySummaryEmail) {
          await ctx.runAction(internal.email.sendWeeklySummary, {
            userId: corridor.userId,
            corridorId: corridor._id,
          });
        }
      } catch (error) {
        console.error(`Error generating weekly briefing for corridor ${corridor._id}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `Weekly briefing cron completed in ${duration}ms: ${generated} generated, ${skipped} skipped, ${errors} errors`
    );

    // Log metrics
    await ctx.runMutation(internal.briefingQueries.logCronRun, {
      type: "weekly",
      generated,
      skipped,
      errors,
      durationMs: duration,
    });
  },
});
