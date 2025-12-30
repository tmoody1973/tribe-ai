import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface StepContext {
  stepTitle: string;
  stepDescription: string;
  stepCategory: string;
  stepPriority: string;
  warnings?: string[];
  hacks?: string[];
  corridorOrigin: string;
  corridorDestination: string;
}

interface SearchResult {
  content: string;
  title: string;
  metadata: {
    url: string;
    author?: string;
    subreddit?: string;
  };
  isCorridorSpecific: boolean;
}

async function searchRelevantContent(
  corridorId: string,
  query: string
): Promise<SearchResult[]> {
  try {
    // Use the vector search action
    const results = await convex.action(api.ai.searchActions.searchRelevantContent, {
      query,
      corridorId: corridorId as Id<"corridors">,
      limit: 5,
      minResults: 2,
    });

    return results;
  } catch (error) {
    console.error("RAG search error:", error);
    // Fallback to recent content if vector search fails
    try {
      const recentContent = await convex.query(api.ingestedContent.getRecentContent, {
        corridorId: corridorId as Id<"corridors">,
        limit: 5,
      });
      return recentContent.map((r) => ({
        content: r.content,
        title: r.title,
        metadata: {
          url: r.url,
          author: r.metadata?.author,
          subreddit: r.metadata?.subreddit,
        },
        isCorridorSpecific: true,
      }));
    } catch {
      return [];
    }
  }
}

export async function POST(req: NextRequest) {
  let stepContext: StepContext | undefined;
  let corridorId: string | undefined;
  let userQuestion: string | undefined;
  let language = "en";

  try {
    const body = await req.json();
    stepContext = body.stepContext;
    corridorId = body.corridorId;
    userQuestion = body.userQuestion;
    language = body.language || "en";

    // Validate required fields
    if (!stepContext || !corridorId) {
      return NextResponse.json(
        { error: "Missing required fields: stepContext and corridorId" },
        { status: 400 }
      );
    }

    // Build search query from step context
    const searchQuery = userQuestion
      ? `${userQuestion} ${stepContext.stepTitle} ${stepContext.stepCategory}`
      : `${stepContext.stepTitle} ${stepContext.stepCategory} ${stepContext.corridorOrigin} to ${stepContext.corridorDestination}`;

    // Get relevant content from RAG
    const relevantContent = await searchRelevantContent(corridorId, searchQuery);

    // Format RAG context
    let ragContext = "";
    if (relevantContent.length > 0) {
      ragContext = "\n\n📚 COMMUNITY KNOWLEDGE (from real migrants):\n";
      for (const result of relevantContent) {
        const source = result.metadata.subreddit
          ? `Reddit r/${result.metadata.subreddit}`
          : result.metadata.url;
        ragContext += `\n---\n[Source: ${source}${result.metadata.author ? ` by ${result.metadata.author}` : ""}]\n${result.content.slice(0, 500)}...\n`;
      }
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are TRIBE's Step Assistant - a helpful AI that provides personalized guidance for migration protocol steps.

CONTEXT:
- User is migrating from ${stepContext.corridorOrigin} to ${stepContext.corridorDestination}
- Current step: "${stepContext.stepTitle}"
- Category: ${stepContext.stepCategory}
- Priority: ${stepContext.stepPriority}
- Description: ${stepContext.stepDescription}
${stepContext.warnings?.length ? `- ⚠️ Warnings: ${stepContext.warnings.join("; ")}` : ""}
${stepContext.hacks?.length ? `- 💡 Tips: ${stepContext.hacks.join("; ")}` : ""}
${ragContext}

YOUR ROLE:
1. Give SPECIFIC, ACTIONABLE advice for THIS step
2. If community knowledge is available, reference it naturally (e.g., "Based on experiences shared by others who've done this...")
3. Estimate time and cost when possible
4. Warn about common mistakes
5. Suggest concrete next actions

RESPONSE FORMAT:
- Start with a brief, encouraging overview
- Use bullet points for actionable items
- Include time/cost estimates if known
- End with "Next steps" section
- Be concise (max 4-5 short paragraphs)
- Respond in ${language === "en" ? "English" : `the user's language (${language})`}`,
    });

    const prompt = userQuestion
      ? `User's question about this step: "${userQuestion}"\n\nProvide helpful, specific guidance based on the step context and any community knowledge available.`
      : `The user just opened this step: "${stepContext.stepTitle}"\n\nProvide a helpful overview including:\n1. What this step involves\n2. Estimated time to complete\n3. Key requirements or documents needed\n4. Common pitfalls to avoid\n5. Suggested next actions`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({
      response: responseText,
      hasRagContent: relevantContent.length > 0,
      sourcesCount: relevantContent.length,
      sources: relevantContent.map(r => ({
        title: r.title,
        url: r.metadata.url,
        isCorridorSpecific: r.isCorridorSpecific,
      })),
    });

  } catch (error) {
    console.error("Step assistant error:", error);

    // Provide a helpful fallback response instead of just an error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate");

    // If it's a rate limit or other API error, provide a helpful fallback response
    if (isRateLimit) {
      return NextResponse.json({
        response: `## ${stepContext?.stepTitle || "Current Step"}\n\n${stepContext?.stepDescription || "No description available."}\n\n**Note:** Our AI assistant is temporarily busy. Here's what you need to know:\n\n- Review any warnings or tips shown on the step card\n- Check the community knowledge section for real experiences\n- Feel free to ask again in a moment\n\n*AI temporarily unavailable due to high demand.*`,
        hasRagContent: false,
        sourcesCount: 0,
        sources: [],
        isFallback: true,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to get step guidance",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
