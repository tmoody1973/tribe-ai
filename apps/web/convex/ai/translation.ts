"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { createHash } from "crypto";

const GOOGLE_TRANSLATE_API_URL = "https://translation.googleapis.com/language/translate/v2";

/**
 * Generate a content hash for cache key
 */
function getContentHash(text: string, targetLang: string): string {
  return createHash("sha256")
    .update(`${text}:${targetLang}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Map TRIBE locale codes to Google Translate language codes
 */
function mapLocaleToGoogleCode(locale: string): string {
  const mapping: Record<string, string> = {
    en: "en",
    es: "es",
    pt: "pt",
    fr: "fr",
    de: "de",
    yo: "yo", // Yoruba - supported by Google
    hi: "hi", // Hindi
    tl: "tl", // Tagalog/Filipino
    ko: "ko", // Korean
  };
  return mapping[locale] || locale;
}

/**
 * Call Google Cloud Translation API
 */
async function callGoogleTranslate(
  text: string,
  targetLang: string,
  sourceLang: string,
  apiKey: string
): Promise<string> {
  const googleTarget = mapLocaleToGoogleCode(targetLang);
  const googleSource = mapLocaleToGoogleCode(sourceLang);

  const response = await fetch(
    `${GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: googleSource,
        target: googleTarget,
        format: "text",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Translate API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data?.translations?.[0]?.translatedText ?? text;
}

interface TranslationResult {
  text: string;
  cached: boolean;
  translated: boolean;
  error?: string;
}

/**
 * Translate a single piece of content
 */
export const translateContent = action({
  args: {
    text: v.string(),
    targetLocale: v.string(),
    sourceLocale: v.optional(v.string()),
  },
  handler: async (ctx, { text, targetLocale, sourceLocale = "en" }): Promise<TranslationResult> => {
    // Skip if same language
    if (targetLocale === sourceLocale) {
      return { text, cached: true, translated: false };
    }

    // Skip empty text
    if (!text.trim()) {
      return { text, cached: true, translated: false };
    }

    // Check cache first
    const hash = getContentHash(text, targetLocale);
    const cached = await ctx.runQuery(api.translation.getCached, { hash });

    if (cached) {
      return { text: cached.translatedText, cached: true, translated: true };
    }

    // Get API key
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_CLOUD_API_KEY not configured");
      return { text, cached: false, translated: false, error: "API key not configured" };
    }

    try {
      // Call Google Cloud Translation
      const translatedText = await callGoogleTranslate(text, targetLocale, sourceLocale, apiKey);

      // Store in cache
      await ctx.runMutation(api.translation.cacheTranslation, {
        hash,
        originalText: text,
        translatedText,
        sourceLocale,
        targetLocale,
        charCount: text.length,
      });

      return { text: translatedText, cached: false, translated: true };
    } catch (error) {
      console.error("Translation failed, returning original:", error);
      return { text, cached: false, translated: false, error: String(error) };
    }
  },
});

interface BatchTranslationResult {
  text: string;
  cached: boolean;
  translated: boolean;
}

/**
 * Batch translate multiple texts (reduces API calls via caching)
 */
export const batchTranslate = action({
  args: {
    texts: v.array(v.string()),
    targetLocale: v.string(),
    sourceLocale: v.optional(v.string()),
  },
  handler: async (ctx, { texts, targetLocale, sourceLocale = "en" }): Promise<BatchTranslationResult[]> => {
    // Skip if same language
    if (targetLocale === sourceLocale) {
      return texts.map((text) => ({ text, cached: true, translated: false }));
    }

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_CLOUD_API_KEY not configured");
      return texts.map((text) => ({ text, cached: false, translated: false }));
    }

    const results: { text: string; cached: boolean; translated: boolean }[] = new Array(texts.length);
    const toTranslate: { index: number; text: string; hash: string }[] = [];

    // Check cache for all texts
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];

      // Skip empty text
      if (!text.trim()) {
        results[i] = { text, cached: true, translated: false };
        continue;
      }

      const hash = getContentHash(text, targetLocale);
      const cached = await ctx.runQuery(api.translation.getCached, { hash });

      if (cached) {
        results[i] = { text: cached.translatedText, cached: true, translated: true };
      } else {
        toTranslate.push({ index: i, text, hash });
      }
    }

    // Translate uncached texts
    if (toTranslate.length > 0) {
      // Translate in parallel (Google API handles batching internally)
      const translations = await Promise.all(
        toTranslate.map(async ({ text }) => {
          try {
            return await callGoogleTranslate(text, targetLocale, sourceLocale, apiKey);
          } catch {
            return text; // Fallback to original on error
          }
        })
      );

      // Cache and store results
      for (let i = 0; i < toTranslate.length; i++) {
        const { index, text, hash } = toTranslate[i];
        const translatedText = translations[i];

        // Only cache if translation was successful
        if (translatedText !== text) {
          await ctx.runMutation(api.translation.cacheTranslation, {
            hash,
            originalText: text,
            translatedText,
            sourceLocale,
            targetLocale,
            charCount: text.length,
          });
        }

        results[index] = { text: translatedText, cached: false, translated: translatedText !== text };
      }
    }

    return results;
  },
});
