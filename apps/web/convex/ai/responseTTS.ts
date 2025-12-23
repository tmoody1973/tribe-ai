"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { textToSpeech } from "../../lib/elevenlabs";

/**
 * Generate audio for a chat response using ElevenLabs TTS
 * Returns a URL to the audio file stored in Convex
 */
export const generateResponseAudio = action({
  args: {
    text: v.string(),
    language: v.string(),
  },
  handler: async (ctx, { text, language }) => {
    // Truncate very long responses for TTS (ElevenLabs has limits)
    const maxLength = 2000;
    const truncatedText =
      text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;

    // Get API key from environment
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    try {
      // Generate audio
      const { audioBuffer, contentType } = await textToSpeech(
        truncatedText,
        language,
        apiKey
      );

      // Store in Convex file storage
      const blob = new Blob([audioBuffer], { type: contentType });
      const storageId = await ctx.storage.store(blob);

      // Get URL for the stored audio
      const audioUrl = await ctx.storage.getUrl(storageId);

      if (!audioUrl) {
        throw new Error("Failed to get audio URL from storage");
      }

      return { audioUrl, storageId };
    } catch (error) {
      console.error("Response TTS generation failed:", error);
      throw error;
    }
  },
});
