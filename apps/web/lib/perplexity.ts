/**
 * Perplexity API client for real-time web search
 * Used as fallback when RAG confidence is low or query needs current information
 */

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface PerplexitySearchResult {
  answer: string;
  citations: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Search Perplexity for real-time information about migration topics
 */
export async function searchPerplexity(
  query: string,
  apiKey: string,
  context?: { origin?: string; destination?: string }
): Promise<PerplexitySearchResult> {
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const systemPrompt = context?.origin && context?.destination
    ? `You are researching migration information for someone moving from ${context.origin} to ${context.destination}.
Focus on current, official information from government sources, embassies, and immigration authorities.
Provide specific, actionable information with dates and processing times when available.
Always mention the date or recency of the information you find.`
    : `You are researching migration and visa information.
Focus on current, official sources from government websites and immigration authorities.
Provide specific, actionable information with dates and processing times when available.`;

  const messages: PerplexityMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages,
      return_citations: true,
      temperature: 0.2, // Lower temperature for factual responses
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data: PerplexityResponse = await response.json();

  return {
    answer: data.choices[0]?.message.content ?? "",
    citations: data.citations ?? [],
    usage: {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    },
  };
}
