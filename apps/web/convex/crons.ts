import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily cleanup of expired ingested content (3 AM UTC)
crons.daily(
  "cleanup expired content",
  { hourUTC: 3, minuteUTC: 0 },
  internal.maintenance.cleanupExpiredContent
);

// Daily pre-emptive refresh of stale corridors (4 AM UTC)
crons.daily(
  "refresh stale corridors",
  { hourUTC: 4, minuteUTC: 0 },
  internal.maintenance.refreshStaleCorridors
);

// Daily feed refresh for all active corridors (6 AM UTC)
crons.daily(
  "refresh corridor feeds",
  { hourUTC: 6, minuteUTC: 0 },
  internal.corridorFeed.refreshAllCorridorFeeds
);

// Daily exchange rate updates (8 AM UTC)
crons.daily(
  "update exchange rates",
  { hourUTC: 8, minuteUTC: 0 },
  internal.financial.updateExchangeRates
);

// Weekly cleanup of old metrics (Sunday 5 AM UTC)
crons.weekly(
  "cleanup old metrics",
  { dayOfWeek: "sunday", hourUTC: 5, minuteUTC: 0 },
  internal.maintenance.cleanupOldMetrics
);

// Daily cleanup of expired translations (3:30 AM UTC)
crons.daily(
  "cleanup expired translations",
  { hourUTC: 3, minuteUTC: 30 },
  internal.translation.cleanExpired
);

// === ENHANCED AUDIO BRIEFINGS (Stories 9.10-9.11) ===

// Daily briefing generation (6 AM UTC)
// TODO: Batch by user timezone for optimal delivery
crons.hourly(
  "generate daily briefings",
  { minuteUTC: 0 },
  internal.briefingScheduler.generateDailyBriefings
);

// Weekly briefing generation (Sunday 7 PM UTC)
crons.weekly(
  "generate weekly briefings",
  { dayOfWeek: "sunday", hourUTC: 19, minuteUTC: 0 },
  internal.briefingScheduler.generateWeeklyBriefings
);

// === VISA DISCOVERY (Story 9.13) ===

// Weekly visa data refresh for active corridors (Sunday 2 AM UTC)
// Budget: 120 API calls/month → 30 corridors × 4 weeks = 120 calls
crons.weekly(
  "refresh visa data",
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
  internal.visaRefreshScheduler.refreshActiveCorridorVisaData
);

export default crons;
