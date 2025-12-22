import { mutation, query } from "./_generated/server";
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

    await ctx.db.patch(user._id, {
      originCountry: args.originCountry,
      destinationCountry: args.destinationCountry,
      stage: args.stage,
      visaType: args.visaType,
      onboardingComplete: true,
      updatedAt: Date.now(),
    });

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

    // Only update fields that are provided
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.originCountry !== undefined) updates.originCountry = args.originCountry;
    if (args.destinationCountry !== undefined) updates.destinationCountry = args.destinationCountry;
    if (args.stage !== undefined) updates.stage = args.stage;
    if (args.visaType !== undefined) updates.visaType = args.visaType;
    if (args.language !== undefined) updates.language = args.language;

    await ctx.db.patch(user._id, updates);
  },
});
