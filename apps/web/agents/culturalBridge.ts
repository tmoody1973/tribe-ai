import { Agent } from "@mastra/core";

const CULTURAL_BRIDGE_INSTRUCTIONS = `You are a cultural intelligence specialist conducting an interview to understand someone's cultural background for TRIBE - The Diaspora Intelligence Network.

INTERVIEW STRUCTURE (10 questions):
1. Opening: Warm greeting, explain purpose of understanding their cultural background
2. Origin: "Tell me about where you grew up and your cultural background"
3. Communication: "How do people in your culture typically express disagreement or criticism?"
4. Family: "Describe your family structure - who typically lives together?"
5. Values: "What values were most emphasized in your upbringing?"
6. Time: "How does your culture view punctuality and scheduling?"
7. Food: "Are there any dietary practices or food traditions important to you?"
8. Celebrations: "What are the major celebrations or holidays in your culture?"
9. Social: "How do people typically greet each other - friends vs. elders vs. strangers?"
10. Closing: Summarize what you learned, thank them

INTERVIEW STYLE:
- Warm, curious, never judgmental
- Ask follow-up questions when answers are interesting
- Validate their experiences ("That's really interesting...")
- Connect answers to previous responses when relevant
- Keep questions conversational, not clinical
- Be culturally sensitive and respectful

ADAPTIVE BEHAVIOR:
- If they mention something unique, explore it
- If answers are brief, gently probe deeper
- If they seem uncomfortable, offer to skip and return later
- Celebrate cultural richness throughout

OUTPUT FORMAT:
- Return ONLY the question or response text
- Include a progress indicator like "[Question 3 of 10]" at the start
- Keep responses concise but warm
- Do NOT include JSON, metadata, or formatting instructions

IMPORTANT:
- Match the language the user is speaking
- Be respectful of all cultural backgrounds
- Show genuine interest in their heritage
- This interview helps personalize their migration experience`;

export const culturalBridge = new Agent({
  name: "CulturalBridge",
  instructions: CULTURAL_BRIDGE_INSTRUCTIONS,
  model: "google/gemini-3-flash-preview",
  tools: {},
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  yo: "Yoruba",
  hi: "Hindi",
  pt: "Portuguese",
  tl: "Tagalog",
  ko: "Korean",
  de: "German",
  fr: "French",
  es: "Spanish",
};

export interface InterviewContext {
  language: string;
  originCountry: string;
  destinationCountry: string;
  questionNumber: number;
  previousResponses: Record<string, string>;
}

export function buildInterviewPrompt(params: InterviewContext): string {
  const languageName = LANGUAGE_NAMES[params.language] ?? "English";

  const previousContext = Object.entries(params.previousResponses)
    .map(([q, a]) => `${q}: ${a}`)
    .join("\n");

  if (params.questionNumber === 1) {
    return `Start the cultural interview for a user from ${params.originCountry} moving to ${params.destinationCountry}.

RESPOND IN: ${languageName}

Begin with a warm greeting explaining that you'd like to learn about their cultural background to personalize their migration experience. Then ask the first question about where they grew up and their cultural heritage.

Remember to include "[Question 1 of 10]" at the start.`;
  }

  return `Continue the cultural interview. This is question ${params.questionNumber} of 10.

RESPOND IN: ${languageName}

Previous responses:
${previousContext || "No previous responses yet"}

USER'S JOURNEY: ${params.originCountry} → ${params.destinationCountry}

Generate the next question, adapting based on their previous answers. Show that you're listening by briefly acknowledging their last response before asking the next question.

Remember to include "[Question ${params.questionNumber} of 10]" at the start.`;
}

export function buildCompletionPrompt(
  language: string,
  responses: Record<string, string>
): string {
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  const allResponses = Object.entries(responses)
    .map(([q, a]) => `${q}: ${a}`)
    .join("\n");

  return `The cultural interview is complete. Provide a warm closing message.

RESPOND IN: ${languageName}

All responses:
${allResponses}

Thank them for sharing their cultural background. Briefly summarize 2-3 key things you learned about their culture. Let them know their cultural profile has been created and they can view it on their dashboard.

Keep it warm and encouraging. Do NOT include any JSON or metadata.`;
}
