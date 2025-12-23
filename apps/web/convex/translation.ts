import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const TRANSLATION_TTL_DAYS = 7;

/**
 * Get cached translation by hash
 */
export const getCached = query({
  args: { hash: v.string() },
  handler: async (ctx, { hash }) => {
    const translation = await ctx.db
      .query("translations")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();

    // Check if expired
    if (translation && translation.expiresAt < Date.now()) {
      return null;
    }

    return translation;
  },
});

/**
 * Cache a translation
 */
export const cacheTranslation = mutation({
  args: {
    hash: v.string(),
    originalText: v.string(),
    translatedText: v.string(),
    sourceLocale: v.string(),
    targetLocale: v.string(),
    charCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if already exists (race condition prevention)
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();

    if (existing) {
      // Update expiry
      await ctx.db.patch(existing._id, {
        expiresAt: Date.now() + TRANSLATION_TTL_DAYS * 24 * 60 * 60 * 1000,
      });
      return existing._id;
    }

    const expiresAt = Date.now() + TRANSLATION_TTL_DAYS * 24 * 60 * 60 * 1000;

    return ctx.db.insert("translations", {
      ...args,
      createdAt: Date.now(),
      expiresAt,
    });
  },
});

/**
 * Get cache statistics
 */
export const getCacheStats = query({
  args: {},
  handler: async (ctx) => {
    const translations = await ctx.db.query("translations").collect();

    const totalChars = translations.reduce((sum, t) => sum + t.charCount, 0);
    const byLocale = translations.reduce(
      (acc, t) => {
        const key = `${t.sourceLocale}->${t.targetLocale}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Count expired
    const now = Date.now();
    const expired = translations.filter((t) => t.expiresAt < now).length;
    const active = translations.length - expired;

    return {
      totalTranslations: translations.length,
      activeTranslations: active,
      expiredTranslations: expired,
      totalCharacters: totalChars,
      estimatedCost: (totalChars / 1_000_000) * 20, // $20/million chars
      byLocalePair: byLocale,
    };
  },
});

/**
 * Clean expired translations
 */
export const cleanExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("translations")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    let deleted = 0;
    let freedChars = 0;

    for (const translation of expired) {
      freedChars += translation.charCount;
      await ctx.db.delete(translation._id);
      deleted++;
    }

    return { deleted, freedChars, timestamp: now };
  },
});

/**
 * Get usage statistics for a time period
 */
export const getUsageStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 30 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const translations = await ctx.db
      .query("translations")
      .filter((q) => q.gt(q.field("createdAt"), cutoff))
      .collect();

    const totalChars = translations.reduce((sum, t) => sum + t.charCount, 0);

    // Group by day
    const byDay = translations.reduce(
      (acc, t) => {
        const day = new Date(t.createdAt).toISOString().split("T")[0];
        if (!acc[day]) {
          acc[day] = { count: 0, chars: 0 };
        }
        acc[day].count++;
        acc[day].chars += t.charCount;
        return acc;
      },
      {} as Record<string, { count: number; chars: number }>
    );

    return {
      period: `${days} days`,
      totalTranslations: translations.length,
      totalCharacters: totalChars,
      estimatedCost: (totalChars / 1_000_000) * 20,
      byDay,
    };
  },
});
