import { GeminiLiveVoice } from "@mastra/voice-google-gemini-live";

// Voice speaker options
export const VOICE_SPEAKERS = {
  Puck: "Puck",       // Friendly, conversational
  Charon: "Charon",   // Deep, authoritative
  Kore: "Kore",       // Warm, empathetic
  Fenrir: "Fenrir",   // Clear, professional
  Aoede: "Aoede",     // Melodic, engaging
} as const;

export type VoiceSpeaker = keyof typeof VOICE_SPEAKERS;

// Language to speaker mapping
export const LANGUAGE_SPEAKERS: Record<string, VoiceSpeaker> = {
  en: "Puck",
  es: "Charon",
  fr: "Kore",
  de: "Fenrir",
  pt: "Aoede",
  yo: "Puck",
  hi: "Kore",
  ko: "Fenrir",
  tl: "Aoede",
};

export interface VoiceSessionConfig {
  apiKey: string;
  speaker?: VoiceSpeaker;
  systemInstruction?: string;
}

/**
 * Create a new Gemini Live voice instance
 */
export function createVoiceInstance(config: VoiceSessionConfig): GeminiLiveVoice {
  return new GeminiLiveVoice({
    apiKey: config.apiKey,
    model: "gemini-2.0-flash-live-001",
    speaker: config.speaker || "Puck",
  });
}

/**
 * Get the appropriate speaker for a language
 */
export function getSpeakerForLanguage(language: string): VoiceSpeaker {
  return LANGUAGE_SPEAKERS[language] || "Puck";
}

/**
 * Migration assistant system instruction for voice
 */
export const MIGRATION_VOICE_INSTRUCTION = `You are TRIBE's Voice Migration Assistant. You help users navigate international relocation through natural conversation.

VOICE INTERACTION STYLE:
- Keep responses concise (2-3 sentences max)
- Speak naturally, as if having a conversation
- Use simple language, avoid jargon
- Pause to let users respond
- Ask clarifying questions when needed

KNOWLEDGE AREAS:
- Visa requirements and processes
- Cost of living comparisons
- Housing and employment
- Cultural adaptation tips
- Community experiences

IMPORTANT:
- Be encouraging and supportive
- Admit when you don't know something
- Suggest consulting official sources for legal advice
- Celebrate user progress`;
