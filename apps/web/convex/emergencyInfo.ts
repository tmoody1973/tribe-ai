import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get emergency info for a corridor (origin -> destination)
export const getEmergencyInfo = query({
  args: {
    origin: v.string(),
    destination: v.string(),
  },
  handler: async (ctx, args) => {
    // Try exact corridor match first
    const info = await ctx.db
      .query("emergencyInfo")
      .withIndex("by_corridor", (q) =>
        q.eq("origin", args.origin).eq("destination", args.destination)
      )
      .first();

    if (info) {
      return info;
    }

    // If no exact match, try destination-only (for emergency numbers at least)
    const destOnly = await ctx.db
      .query("emergencyInfo")
      .withIndex("by_destination", (q) => q.eq("destination", args.destination))
      .first();

    return destOnly || null;
  },
});

// Save or update emergency info
export const saveEmergencyInfo = mutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    emergencyNumber: v.string(),
    policeNumber: v.string(),
    ambulanceNumber: v.string(),
    fireNumber: v.string(),
    embassy: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      email: v.string(),
      website: v.optional(v.string()),
      hours: v.optional(v.string()),
    }),
    phrases: v.array(
      v.object({
        phrase: v.string(),
        meaning: v.string(),
        pronunciation: v.optional(v.string()),
      })
    ),
    healthcareInfo: v.string(),
    healthcareEmergency: v.optional(v.string()),
    migrantHelpline: v.optional(v.string()),
    mentalHealthHotline: v.optional(v.string()),
    domesticViolenceHotline: v.optional(v.string()),
    localEmergencyApp: v.optional(v.string()),
    insuranceInfo: v.optional(v.string()),
    sourceUrls: v.optional(v.array(v.string())),
    confidence: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if entry already exists
    const existing = await ctx.db
      .query("emergencyInfo")
      .withIndex("by_corridor", (q) =>
        q.eq("origin", args.origin).eq("destination", args.destination)
      )
      .first();

    const data = {
      ...args,
      lastResearchedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("emergencyInfo", data);
    }
  },
});

// Check if emergency info needs refresh (older than 30 days)
export const needsRefresh = query({
  args: {
    origin: v.string(),
    destination: v.string(),
  },
  handler: async (ctx, args) => {
    const info = await ctx.db
      .query("emergencyInfo")
      .withIndex("by_corridor", (q) =>
        q.eq("origin", args.origin).eq("destination", args.destination)
      )
      .first();

    if (!info) {
      return true; // No data, needs fetch
    }

    // Refresh if older than 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return info.lastResearchedAt < thirtyDaysAgo;
  },
});
