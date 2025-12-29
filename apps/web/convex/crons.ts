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

export default crons;
