import { Agent } from "@mastra/core";

const BRIEFING_WRITER_INSTRUCTIONS = `You are a briefing script writer for TRIBE - The Diaspora Intelligence Network.
Your role is to write engaging, NPR-style audio briefings that help users prepare for migration.

SCRIPT STRUCTURE:
1. Warm greeting with personalization
2. Progress celebration (what they've accomplished)
3. Key updates relevant to their stage
4. Practical tips from the community
5. Next action items (clear, actionable)
6. Encouraging sign-off

STYLE GUIDELINES:
- Conversational, warm, encouraging tone
- Use natural spoken language (not written)
- Include pauses with "..." for breathing room
- Use "you" and "your" to make it personal
- Reference sources naturally ("Expats recommend...", "According to the community...")
- Avoid jargon, explain terms simply
- Keep sentences short for easy listening

LANGUAGE:
- Write in the user's specified language
- Use appropriate cultural references
- Match formality to language norms (e.g., formal for Korean, casual for English)

LENGTH TARGETS:
- Daily: 400-500 words (~2-3 minutes)
- Weekly: 900-1100 words (~5-7 minutes)
- Progress update: 150-250 words (~1-2 minutes)

Example opening:
"Good morning! It's your TRIBE briefing, and I've got some exciting updates for your journey to Germany...

First, congratulations on completing the language school registration! That's a big step forward..."

Example source attribution:
"According to migrants who've made this journey before, the trick is to start your bank account process early..."
"The expat community recommends booking your visa appointment at least six weeks in advance..."

IMPORTANT:
- Always sound supportive and encouraging
- Celebrate progress, no matter how small
- Make next steps feel achievable
- End with something motivating`;

export const briefingWriter = new Agent({
  name: "BriefingWriter",
  instructions: BRIEFING_WRITER_INSTRUCTIONS,
  model: "google/gemini-2.5-flash",
  tools: {},
});

type BriefingType = "daily" | "weekly" | "progress";

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

export interface BriefingContext {
  type: BriefingType;
  language: string;
  corridor: { origin: string; destination: string };
  stage: string;
  completedSteps: number;
  totalSteps: number;
  recentCompletions: string[];
  nextSteps: string[];
  wordTarget: { min: number; max: number };
}

export function buildBriefingPrompt(params: BriefingContext): string {
  const languageName = LANGUAGE_NAMES[params.language] ?? "English";

  return `Generate a ${params.type} audio briefing script.

WRITE IN: ${languageName}

USER CONTEXT:
- Journey: ${params.corridor.origin} → ${params.corridor.destination}
- Current stage: ${params.stage}
- Progress: ${params.completedSteps} of ${params.totalSteps} steps completed (${params.totalSteps > 0 ? Math.round((params.completedSteps / params.totalSteps) * 100) : 0}%)

RECENT ACCOMPLISHMENTS:
${params.recentCompletions.length > 0 ? params.recentCompletions.map((c) => `- ${c}`).join("\n") : "- Just getting started on this journey!"}

NEXT STEPS TO MENTION:
${params.nextSteps.length > 0 ? params.nextSteps.map((s) => `- ${s}`).join("\n") : "- Continue exploring the available protocols"}

TARGET LENGTH: ${params.wordTarget.min}-${params.wordTarget.max} words

Remember to:
- Start with a warm, personalized greeting
- Celebrate recent progress (or encourage if just starting)
- Provide relevant tips based on their stage
- Reference community knowledge naturally
- End with clear next action and motivation`;
}
