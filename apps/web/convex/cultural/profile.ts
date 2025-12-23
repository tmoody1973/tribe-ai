import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "../_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's cultural profile
 */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    return ctx.db
      .query("culturalProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

/**
 * Internal query to get profile by userId
 */
export const getProfileInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("culturalProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Save or update cultural profile from interview responses
 */
export const saveProfile = mutation({
  args: {
    originCulture: v.string(),
    communicationStyle: v.union(
      v.literal("direct"),
      v.literal("indirect"),
      v.literal("context-dependent")
    ),
    familyStructure: v.union(
      v.literal("nuclear"),
      v.literal("extended"),
      v.literal("multi-generational")
    ),
    timeOrientation: v.union(
      v.literal("monochronic"),
      v.literal("polychronic")
    ),
    values: v.array(v.string()),
    foodDietary: v.array(v.string()),
    celebrations: v.array(v.string()),
    interviewResponses: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("culturalProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("culturalProfiles", {
      userId: user._id,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Internal mutation to save profile
 */
export const saveProfileInternal = internalMutation({
  args: {
    userId: v.id("users"),
    originCulture: v.string(),
    communicationStyle: v.union(
      v.literal("direct"),
      v.literal("indirect"),
      v.literal("context-dependent")
    ),
    familyStructure: v.union(
      v.literal("nuclear"),
      v.literal("extended"),
      v.literal("multi-generational")
    ),
    timeOrientation: v.union(
      v.literal("monochronic"),
      v.literal("polychronic")
    ),
    values: v.array(v.string()),
    foodDietary: v.array(v.string()),
    celebrations: v.array(v.string()),
    interviewResponses: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("culturalProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        originCulture: args.originCulture,
        communicationStyle: args.communicationStyle,
        familyStructure: args.familyStructure,
        timeOrientation: args.timeOrientation,
        values: args.values,
        foodDietary: args.foodDietary,
        celebrations: args.celebrations,
        interviewResponses: args.interviewResponses,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("culturalProfiles", {
      userId: args.userId,
      originCulture: args.originCulture,
      communicationStyle: args.communicationStyle,
      familyStructure: args.familyStructure,
      timeOrientation: args.timeOrientation,
      values: args.values,
      foodDietary: args.foodDietary,
      celebrations: args.celebrations,
      interviewResponses: args.interviewResponses,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update specific profile fields
 */
export const updateProfile = mutation({
  args: {
    originCulture: v.optional(v.string()),
    communicationStyle: v.optional(
      v.union(
        v.literal("direct"),
        v.literal("indirect"),
        v.literal("context-dependent")
      )
    ),
    familyStructure: v.optional(
      v.union(
        v.literal("nuclear"),
        v.literal("extended"),
        v.literal("multi-generational")
      )
    ),
    timeOrientation: v.optional(
      v.union(v.literal("monochronic"), v.literal("polychronic"))
    ),
    values: v.optional(v.array(v.string())),
    foodDietary: v.optional(v.array(v.string())),
    celebrations: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("culturalProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) throw new Error("Cultural profile not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.originCulture !== undefined) updates.originCulture = args.originCulture;
    if (args.communicationStyle !== undefined) updates.communicationStyle = args.communicationStyle;
    if (args.familyStructure !== undefined) updates.familyStructure = args.familyStructure;
    if (args.timeOrientation !== undefined) updates.timeOrientation = args.timeOrientation;
    if (args.values !== undefined) updates.values = args.values;
    if (args.foodDietary !== undefined) updates.foodDietary = args.foodDietary;
    if (args.celebrations !== undefined) updates.celebrations = args.celebrations;

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

/**
 * Delete cultural profile (for re-interview)
 */
export const deleteProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("culturalProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (profile) {
      await ctx.db.delete(profile._id);
    }
  },
});

/**
 * Internal mutation to delete profile by ID
 */
export const deleteProfileInternal = internalMutation({
  args: { profileId: v.id("culturalProfiles") },
  handler: async (ctx, { profileId }) => {
    await ctx.db.delete(profileId);
  },
});
