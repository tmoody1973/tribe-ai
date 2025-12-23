"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

interface Source {
  index: number;
  url: string;
  author: string | undefined;
  date: string | undefined;
}

interface RAGContext {
  context: string;
  sources: Source[];
  corridorInfo: {
    origin: string;
    destination: string;
    stage: string;
  } | null;
  resultCount: number;
}

interface SynthesisResult {
  answer: string;
  sources: Source[];
  ragContext: RAGContext;
  latencyMs: number;
}

/**
 * Build RAG context for Q&A synthesis
 * Retrieves relevant content and formats it for LLM consumption
 */
export const buildRAGContext = action({
  args: {
    question: v.string(),
    corridorId: v.optional(v.id("corridors")),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { question, corridorId, limit = 10 }
  ): Promise<RAGContext> => {
    const startTime = Date.now();

    // Step 1: Retrieve relevant content
    const searchResults = await ctx.runAction(
      api.ai.searchActions.searchRelevantContent,
      {
        query: question,
        corridorId,
        limit,
        minResults: 3,
      }
    );

    // Step 2: Get corridor info if provided
    let corridorInfo = null;
    if (corridorId) {
      const corridor = await ctx.runQuery(api.corridors.getCorridor, {
        id: corridorId,
      });
      if (corridor) {
        corridorInfo = {
          origin: corridor.origin,
          destination: corridor.destination,
          stage: corridor.stage,
        };
      }
    }

    // Step 3: Build formatted context
    const context = searchResults
      .map((r, i) => {
        const date = r.metadata.publishedAt
          ? new Date(r.metadata.publishedAt).toLocaleDateString()
          : "unknown date";
        const author = r.metadata.author ?? "community member";

        return `[Source ${i + 1}] (${author}, ${date})
${r.content}
---`;
      })
      .join("\n\n");

    // Step 4: Build sources list
    const sources: Source[] = searchResults.map((r, i) => ({
      index: i + 1,
      url: r.metadata.url,
      author: r.metadata.author,
      date: r.metadata.publishedAt
        ? new Date(r.metadata.publishedAt).toLocaleDateString()
        : undefined,
    }));

    const latency = Date.now() - startTime;
    console.log(
      `RAG context built in ${latency}ms, ${searchResults.length} sources`
    );

    return {
      context,
      sources,
      corridorInfo,
      resultCount: searchResults.length,
    };
  },
});

/**
 * Get Q&A system prompt for migration advisor
 */
export const getSystemPrompt = action({
  args: {
    language: v.optional(v.string()),
    corridorInfo: v.optional(
      v.object({
        origin: v.string(),
        destination: v.string(),
        stage: v.string(),
      })
    ),
  },
  handler: async (ctx, { language = "en", corridorInfo }): Promise<string> => {
    const languageNames: Record<string, string> = {
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

    const corridorContext = corridorInfo
      ? `The user is planning to migrate from ${corridorInfo.origin} to ${corridorInfo.destination}. They are currently in the "${corridorInfo.stage}" stage of their migration journey.`
      : "The user has not specified a migration corridor yet.";

    return `You are TRIBE's Migration Intelligence Advisor, helping users navigate international relocation using community-sourced knowledge.

${corridorContext}

IMPORTANT RULES:
1. Always respond in ${languageNames[language] || "English"}
2. Cite sources using [1], [2], etc. format when referencing community knowledge
3. Be concise but actionable - users need practical guidance
4. Admit when information is not available rather than guessing
5. Never invent facts not in the provided context
6. Flag potentially outdated information with warnings
7. Prioritize community experiences and real-world tips

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide supporting details with citations
- End with actionable next steps if applicable
- Include a Sources section at the end listing cited references

Example format:
"Based on community experiences, the German visa typically takes 4-6 weeks to process [1].

Key tips from others who've done this:
- Apply at least 2 months before your planned travel [2]
- Book your appointment early as slots fill quickly [1]

**Sources:**
[1] Reddit user u/expat_berlin, 2024
[2] InterNations forum, December 2024"`;
  },
});

/**
 * Format answer with sources section if missing
 */
function formatAnswer(rawAnswer: string, sources: Source[]): string {
  // Check if sources section already exists
  if (rawAnswer.toLowerCase().includes("sources:")) {
    return rawAnswer;
  }

  // Add sources section
  const sourcesSection = sources
    .map((s) => {
      const authorDate = [s.author, s.date].filter(Boolean).join(", ");
      return `[${s.index}] ${s.url}${authorDate ? ` (${authorDate})` : ""}`;
    })
    .join("\n");

  return `${rawAnswer}\n\n**Sources:**\n${sourcesSection}`;
}

/**
 * Build user prompt with RAG context
 */
export const buildUserPrompt = action({
  args: {
    question: v.string(),
    ragContext: v.string(),
    corridorInfo: v.optional(
      v.object({
        origin: v.string(),
        destination: v.string(),
        stage: v.string(),
      })
    ),
  },
  handler: async (ctx, { question, ragContext, corridorInfo }): Promise<string> => {
    const corridorHint = corridorInfo
      ? `\n\nContext: User is migrating from ${corridorInfo.origin} to ${corridorInfo.destination} (${corridorInfo.stage} stage).`
      : "";

    return `COMMUNITY KNOWLEDGE:
${ragContext}

USER QUESTION:
${question}${corridorHint}

Remember to cite sources using [1], [2], etc. and include a Sources section at the end.`;
  },
});
