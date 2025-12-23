import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      language: "en",
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteByClerkId = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

export const updateLanguage = mutation({
  args: {
    language: v.union(
      v.literal("en"),
      v.literal("yo"),
      v.literal("hi"),
      v.literal("pt"),
      v.literal("tl"),
      v.literal("ko"),
      v.literal("de"),
      v.literal("fr"),
      v.literal("es")
    ),
  },
  handler: async (ctx, { language }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { language });
  },
});

export const completeOnboarding = mutation({
  args: {
    originCountry: v.string(),
    destinationCountry: v.string(),
    stage: v.union(
      v.literal("dreaming"),
      v.literal("planning"),
      v.literal("preparing"),
      v.literal("relocating"),
      v.literal("settling")
    ),
    visaType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Update user profile
    await ctx.db.patch(user._id, {
      originCountry: args.originCountry,
      destinationCountry: args.destinationCountry,
      stage: args.stage,
      visaType: args.visaType,
      onboardingComplete: true,
      updatedAt: now,
    });

    // Check if corridor already exists for this user
    const existingCorridor = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingCorridor) {
      // Update existing corridor
      await ctx.db.patch(existingCorridor._id, {
        origin: args.originCountry,
        destination: args.destinationCountry,
        stage: args.stage,
        updatedAt: now,
      });
    } else {
      // Create new corridor
      await ctx.db.insert("corridors", {
        userId: user._id,
        origin: args.originCountry,
        destination: args.destinationCountry,
        stage: args.stage,
        createdAt: now,
        updatedAt: now,
      });
    }

    return user._id;
  },
});

export const updateProfile = mutation({
  args: {
    originCountry: v.optional(v.string()),
    destinationCountry: v.optional(v.string()),
    stage: v.optional(
      v.union(
        v.literal("dreaming"),
        v.literal("planning"),
        v.literal("preparing"),
        v.literal("relocating"),
        v.literal("settling")
      )
    ),
    visaType: v.optional(v.string()),
    language: v.optional(
      v.union(
        v.literal("en"),
        v.literal("yo"),
        v.literal("hi"),
        v.literal("pt"),
        v.literal("tl"),
        v.literal("ko"),
        v.literal("de"),
        v.literal("fr"),
        v.literal("es")
      )
    ),
    autoSpeak: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Only update fields that are provided
    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.originCountry !== undefined) updates.originCountry = args.originCountry;
    if (args.destinationCountry !== undefined) updates.destinationCountry = args.destinationCountry;
    if (args.stage !== undefined) updates.stage = args.stage;
    if (args.visaType !== undefined) updates.visaType = args.visaType;
    if (args.language !== undefined) updates.language = args.language;
    if (args.autoSpeak !== undefined) updates.autoSpeak = args.autoSpeak;

    await ctx.db.patch(user._id, updates);

    // Sync corridor if origin/destination/stage changed
    if (args.originCountry || args.destinationCountry || args.stage) {
      const corridor = await ctx.db
        .query("corridors")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      const corridorUpdates: Record<string, unknown> = { updatedAt: now };
      if (args.originCountry) corridorUpdates.origin = args.originCountry;
      if (args.destinationCountry) corridorUpdates.destination = args.destinationCountry;
      if (args.stage) corridorUpdates.stage = args.stage;

      if (corridor) {
        await ctx.db.patch(corridor._id, corridorUpdates);
      }
    }
  },
});

// Sync corridor for existing users who completed onboarding before corridor system
export const syncUserCorridor = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.onboardingComplete || !user.originCountry || !user.destinationCountry || !user.stage) {
      throw new Error("User has not completed onboarding");
    }

    // Check if corridor exists
    const existingCorridor = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingCorridor) {
      return existingCorridor._id;
    }

    // Create corridor from user profile
    const now = Date.now();
    const corridorId = await ctx.db.insert("corridors", {
      userId: user._id,
      origin: user.originCountry,
      destination: user.destinationCountry,
      stage: user.stage as "dreaming" | "planning" | "preparing" | "relocating" | "settling",
      createdAt: now,
      updatedAt: now,
    });

    return corridorId;
  },
});

// Backfill corridors for all users who completed onboarding (admin use)
export const backfillCorridors = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    let created = 0;

    for (const user of users) {
      if (!user.onboardingComplete || !user.originCountry || !user.destinationCountry || !user.stage) {
        continue;
      }

      // Check if corridor exists
      const existingCorridor = await ctx.db
        .query("corridors")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!existingCorridor) {
        await ctx.db.insert("corridors", {
          userId: user._id,
          origin: user.originCountry,
          destination: user.destinationCountry,
          stage: user.stage as "dreaming" | "planning" | "preparing" | "relocating" | "settling",
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created };
  },
});

// Internal query to get user by Clerk ID (for actions)
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});
