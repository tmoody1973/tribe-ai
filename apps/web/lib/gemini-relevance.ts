import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export interface FeedItem {
  source: "reddit" | "youtube" | "forum" | "news" | "official";
  type?: string;
  title: string;
  snippet: string;
  url: string;
  thumbnail?: string;
  author?: string;
  subreddit?: string;
  upvotes?: number;
  comments?: number;
  timestamp?: number;
  isAlert?: boolean;
  alertType?: "opportunity" | "warning" | "update";
}

export interface AnalyzedFeedItem extends FeedItem {
  relevanceScore: number;
  stageScore: number;
  aiReason: string;
}

export interface UserContext {
  origin: string;
  destination: string;
  stage: "dreaming" | "planning" | "preparing" | "relocating" | "settling";
}

interface GeminiAnalysis {
  postIndex: number;
  relevanceScore: number;
  stageScore: number;
  isAlert: boolean;
  alertType: "opportunity" | "warning" | "update" | "none";
  reason: string;
}

/**
 * Analyze feed items for relevance using Gemini AI
 * Filters out items with relevance score < 50
 */
export async function analyzeRelevance(
  posts: FeedItem[],
  userContext: UserContext,
  debugLog?: (msg: string) => void
): Promise<AnalyzedFeedItem[]> {
  const log = debugLog || console.log;

  if (!process.env.GOOGLE_AI_API_KEY) {
    log("Google AI API key not configured - falling back to keyword filtering");
    return fallbackKeywordFilter(posts, userContext);
  }

  if (posts.length === 0) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Batch posts for efficient analysis (10 per batch)
    const batchSize = 10;
    const batches: FeedItem[][] = [];

    for (let i = 0; i < posts.length; i += batchSize) {
      batches.push(posts.slice(i, i + batchSize));
    }

    log(`Analyzing ${posts.length} posts in ${batches.length} batches with Gemini...`);

    const analyzedPosts: AnalyzedFeedItem[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      const prompt = buildAnalysisPrompt(batch, userContext);

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          log(`Batch ${batchIndex + 1}: Failed to parse Gemini response, using fallback`);
          analyzedPosts.push(...fallbackKeywordFilter(batch, userContext));
          continue;
        }

        const analyses: GeminiAnalysis[] = JSON.parse(jsonMatch[0]);

        // Merge analyses with posts
        for (const analysis of analyses) {
          const post = batch[analysis.postIndex];
          if (!post) continue;

          // Filter threshold: only include relevance >= 50
          if (analysis.relevanceScore >= 50) {
            analyzedPosts.push({
              ...post,
              relevanceScore: analysis.relevanceScore,
              stageScore: analysis.stageScore,
              isAlert: analysis.isAlert,
              alertType: analysis.alertType !== "none" ? analysis.alertType : undefined,
              aiReason: analysis.reason,
            });
          }
        }

        log(`Batch ${batchIndex + 1}: Analyzed ${analyses.length} posts, kept ${analyses.filter(a => a.relevanceScore >= 50).length} relevant`);
      } catch (err) {
        const error = err as Error;
        log(`Batch ${batchIndex + 1} error: ${error.message}, using fallback`);
        analyzedPosts.push(...fallbackKeywordFilter(batch, userContext));
      }

      // Small delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Sort by relevance score (highest first)
    const sortedPosts = analyzedPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    log(`Total: ${sortedPosts.length} relevant posts from ${posts.length} analyzed`);

    return sortedPosts;
  } catch (error) {
    const err = error as Error;
    log(`Gemini analysis failed: ${err.message}, falling back to keyword filtering`);
    return fallbackKeywordFilter(posts, userContext);
  }
}

/**
 * Build analysis prompt for Gemini
 */
function buildAnalysisPrompt(batch: FeedItem[], userContext: UserContext): string {
  const stageDescriptions = {
    dreaming: "just exploring options, researching countries",
    planning: "seriously planning to move, researching requirements and timelines",
    preparing: "actively preparing documents, applying for visas, arranging logistics",
    relocating: "in the process of moving or just arrived",
    settling: "settling in, finding housing/jobs, integrating into local culture"
  };

  return `You are analyzing social media posts for a migration corridor feed.

USER CONTEXT:
- Origin: ${userContext.origin}
- Destination: ${userContext.destination}
- Journey Stage: ${userContext.stage} (${stageDescriptions[userContext.stage]})

POSTS TO ANALYZE:
${batch.map((post, i) => `
POST ${i}:
Title: ${post.title}
Content: ${post.snippet}
Source: ${post.source}
URL: ${post.url}
`).join('\n---\n')}

For EACH post, determine:

1. **Relevance Score** (0-100): How relevant is this for someone moving from ${userContext.origin} to ${userContext.destination}?

SCORING CRITERIA:
- 90-100: Directly about ${userContext.destination} immigration/visa/moving process, highly actionable
- 70-89: Relevant to ${userContext.destination} migration but more general (housing, jobs, culture tips)
- 50-69: Tangentially related (${userContext.destination} travel, expat life, not migration-specific)
- 30-49: Mentions ${userContext.destination} but not migration-related (news, sports, food)
- 0-29: Irrelevant, negative mention, or about different country

2. **Stage Score** (0-100): How relevant for someone in "${userContext.stage}" stage?

STAGE MATCHING:
- dreaming: Country comparisons, pros/cons, "is it worth it", quality of life
- planning: Visa requirements, timelines, cost breakdowns, document lists
- preparing: Application tips, interview experiences, document submission guides
- relocating: Arrival tips, first week survival, temporary housing, customs
- settling: Long-term housing, job hunting, making friends, local integration

3. **Is Alert** (true/false): Is this time-sensitive, critical, or requires immediate action?

4. **Alert Type**: opportunity | warning | update | none

ALERT DETECTION (context-aware):
- opportunity: Job openings, visa slots opened, fast-track programs, urgent hiring
- warning: Scams, fraud alerts, policy changes that make things harder, rejections to avoid
- update: New requirements, fee changes, processing time updates, rule changes

5. **Reason** (1 sentence): Why this score? Be specific.

IMPORTANT:
- Be strict: Only high relevance scores for actual migration content
- "I love living in ${userContext.destination}" with no migration context = 40-60 max
- City names (Tokyo, Berlin) without country name are still relevant
- Understand synonyms: "relocating", "moving", "immigrating", "expat" are all migration-related
- False positives hurt user experience: filter aggressively

Return ONLY a JSON array, no markdown formatting:
[
  {
    "postIndex": 0,
    "relevanceScore": 85,
    "stageScore": 70,
    "isAlert": false,
    "alertType": "none",
    "reason": "Detailed work visa requirements for ${userContext.destination}"
  },
  ...
]`;
}

/**
 * Fallback keyword-based filtering when Gemini unavailable
 */
function fallbackKeywordFilter(
  posts: FeedItem[],
  userContext: UserContext
): AnalyzedFeedItem[] {
  const destination = userContext.destination.toLowerCase();

  return posts
    .filter((post) => {
      const text = (post.title + " " + post.snippet).toLowerCase();
      return text.includes(destination);
    })
    .map((post) => ({
      ...post,
      relevanceScore: 60, // Default moderate score
      stageScore: 50,
      aiReason: "Keyword-based filter (Gemini unavailable)",
    }));
}
