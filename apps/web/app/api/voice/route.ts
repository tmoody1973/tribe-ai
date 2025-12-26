import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

// Language names for Gemini prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  yo: "Yoruba",
  hi: "Hindi",
  ko: "Korean",
  tl: "Tagalog",
};

function getSystemInstruction(language: string): string {
  const langName = LANGUAGE_NAMES[language] || "English";

  return `You are TRIBE's Voice Migration Assistant. You help users navigate international relocation.

LANGUAGE: The user may speak in any language. Detect their language from the audio and respond in THE SAME LANGUAGE they used. If unsure, use ${langName}.

VOICE STYLE:
- Keep responses VERY concise (2-3 sentences max)
- Speak naturally, like a helpful friend
- Be warm, encouraging, and supportive
- Ask one follow-up question if helpful

KNOWLEDGE:
- Visa requirements and processes
- Cost of living comparisons
- Housing and employment abroad
- Cultural adaptation tips
- Community experiences from real migrants

IMPORTANT:
- Match the user's language in your response
- Be honest when you don't know something
- Suggest official sources for legal matters`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const textInput = formData.get("text") as string | null;
    const language = formData.get("language") as string || "en";

    if (!audioFile && !textInput) {
      return NextResponse.json(
        { error: "Either audio or text input is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: getSystemInstruction(language),
    });

    if (audioFile) {
      // For audio input, use Gemini's multimodal capabilities
      const audioBuffer = await audioFile.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: audioFile.type || "audio/webm",
            data: base64Audio,
          },
        },
        {
          text: `Listen to this audio message. The user is asking about migration/relocation.

First, detect what language the user is speaking.
Then, respond in THAT SAME LANGUAGE with helpful migration advice.

Format your response as:
[DETECTED_LANGUAGE: language_code]
[TRANSCRIPTION: what the user said]
[RESPONSE: your helpful response in the user's language]`,
        },
      ]);

      const responseText = result.response.text();

      // Parse the structured response
      const detectedLangMatch = responseText.match(/\[DETECTED_LANGUAGE:\s*(\w+)\]/);
      const transcriptionMatch = responseText.match(/\[TRANSCRIPTION:\s*([^\]]+)\]/);
      // Extract response - look for [RESPONSE: and capture until final ]
      const responseStartIdx = responseText.indexOf("[RESPONSE:");
      let extractedResponse = responseText;
      if (responseStartIdx !== -1) {
        const afterResponse = responseText.slice(responseStartIdx + 10);
        const endIdx = afterResponse.lastIndexOf("]");
        extractedResponse = endIdx !== -1 ? afterResponse.slice(0, endIdx).trim() : afterResponse.trim();
      }

      return NextResponse.json({
        text: extractedResponse,
        transcription: transcriptionMatch?.[1]?.trim() || "Audio processed",
        detectedLanguage: detectedLangMatch?.[1]?.toLowerCase() || language,
      });
    }

    // Text-only input - respond in the specified language
    const langName = LANGUAGE_NAMES[language] || "English";
    const result = await model.generateContent(
      `User says (respond in ${langName}): ${textInput}`
    );

    return NextResponse.json({
      text: result.response.text(),
    });

  } catch (error) {
    console.error("Voice API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate");

    if (isRateLimit) {
      return NextResponse.json({
        text: "I'm experiencing high demand right now. Please try again in a moment, or type your question instead.",
        transcription: "Audio received",
        detectedLanguage: "en",
        isFallback: true,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to process voice input",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
