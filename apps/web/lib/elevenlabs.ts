/**
 * ElevenLabs Text-to-Speech client
 * Generates natural-sounding audio from text in multiple languages
 */

// Voice IDs for supported languages
// Using ElevenLabs multilingual v2 model for best quality across languages
const VOICE_MAP: Record<string, string> = {
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel (English - warm, professional)
  yo: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
  hi: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
  pt: "ErXwobaYiN019PkySvjV", // Antoni (Portuguese)
  tl: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
  ko: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
  de: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
  fr: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
  es: "EXAVITQu4vr4xnSDxMaL", // Bella (multilingual)
};

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export interface TTSResult {
  audioBuffer: ArrayBuffer;
  contentType: string;
}

/**
 * Convert text to speech using ElevenLabs API
 * @param text - The text to convert to speech
 * @param language - Language code (en, yo, hi, pt, tl, ko, de, fr, es)
 * @param apiKey - ElevenLabs API key
 * @returns Audio buffer in MP3 format
 */
export async function textToSpeech(
  text: string,
  language: string,
  apiKey: string
): Promise<TTSResult> {
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured");
  }

  const voiceId = VOICE_MAP[language] ?? VOICE_MAP.en;

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "audio/mpeg";

  return { audioBuffer, contentType };
}

/**
 * Estimate audio duration based on word count
 * Average speaking rate is ~150 words per minute
 * @param wordCount - Number of words in the text
 * @returns Estimated duration in seconds
 */
export function estimateAudioDuration(wordCount: number): number {
  // Average speaking rate: ~150 words per minute
  return Math.ceil((wordCount / 150) * 60);
}

/**
 * Get the voice name for a given language
 * @param language - Language code
 * @returns Voice name for display
 */
export function getVoiceName(language: string): string {
  const voiceNames: Record<string, string> = {
    en: "Rachel",
    pt: "Antoni",
    yo: "Bella",
    hi: "Bella",
    tl: "Bella",
    ko: "Bella",
    de: "Bella",
    fr: "Bella",
    es: "Bella",
  };
  return voiceNames[language] ?? "Bella";
}

// ============================================
// Speech-to-Text (STT) Functions
// ============================================

export interface STTResult {
  text: string;
  language: string;
}

/**
 * Convert speech to text using ElevenLabs STT API
 * @param audioBlob - Audio blob from MediaRecorder (webm format)
 * @param languageHint - Optional language code to help transcription
 * @returns Transcribed text and detected language
 */
export async function speechToText(
  audioBlob: Blob,
  languageHint?: string
): Promise<STTResult> {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured");
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  // Add model_id for better accuracy
  formData.append("model_id", "scribe_v1");

  if (languageHint) {
    formData.append("language_code", languageHint);
  }

  const response = await fetch(
    `${ELEVENLABS_API_URL}/speech-to-text`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs STT error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    text: data.text || "",
    language: data.language_code || languageHint || "en",
  };
}
