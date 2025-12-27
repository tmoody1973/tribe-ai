import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface VideoAnalysis {
  summary: string; // 2-3 sentence TL;DR
  keyTimestamps: Array<{
    time: string; // "MM:SS" format
    topic: string;
  }>;
  youllLearn: string; // One sentence on concrete takeaways
}

export interface AnalyzedVideo {
  videoId: string;
  transcript: string;
  analysis: VideoAnalysis;
  cachedAt: number;
}

/**
 * Analyze YouTube video transcript using Gemini AI
 * Results cached for 7 days to minimize API usage
 */
export async function analyzeVideoTranscript(
  videoId: string,
  videoTitle: string,
  destination: string,
  debugLog?: (msg: string) => void
): Promise<VideoAnalysis | null> {
  const log = debugLog || console.log;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    log("Google AI API key not configured - skipping video analysis");
    return null;
  }

  try {
    // Check cache first (7-day TTL)
    const cached = await getCachedAnalysis(videoId);
    if (cached) {
      log(`Using cached analysis for video ${videoId}`);
      return cached.analysis;
    }

    // Extract transcript
    log(`Extracting transcript for video ${videoId}...`);
    const transcript = await extractTranscript(videoId);

    if (!transcript) {
      log(`No transcript available for video ${videoId}`);
      return null;
    }

    log(`Transcript extracted (${transcript.length} characters), analyzing with Gemini...`);

    // Analyze with Gemini
    const analysis = await analyzeWithGemini(transcript, videoTitle, destination, log);

    if (analysis) {
      // Cache the result for 7 days
      await cacheAnalysis(videoId, transcript, analysis);
      log(`Analysis complete and cached for video ${videoId}`);
    }

    return analysis;
  } catch (error) {
    const err = error as Error;
    log(`Error analyzing video ${videoId}: ${err.message}`);
    return null;
  }
}

/**
 * Extract transcript from YouTube video
 */
async function extractTranscript(videoId: string): Promise<string | null> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return null;
    }

    // Combine all transcript text
    const fullText = transcriptItems.map((item) => item.text).join(" ");

    return fullText;
  } catch {
    // Video might not have transcripts or they're disabled
    return null;
  }
}

/**
 * Analyze transcript with Gemini AI
 */
async function analyzeWithGemini(
  transcript: string,
  videoTitle: string,
  destination: string,
  log: (msg: string) => void
): Promise<VideoAnalysis | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Limit transcript to first 10,000 characters for token efficiency
    const limitedTranscript = transcript.slice(0, 10000);

    const prompt = buildAnalysisPrompt(limitedTranscript, videoTitle, destination);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log("Failed to parse Gemini video analysis response");
      return null;
    }

    const analysis: VideoAnalysis = JSON.parse(jsonMatch[0]);

    return analysis;
  } catch (error) {
    const err = error as Error;
    log(`Gemini analysis error: ${err.message}`);
    return null;
  }
}

/**
 * Build analysis prompt for Gemini
 */
function buildAnalysisPrompt(
  transcript: string,
  videoTitle: string,
  destination: string
): string {
  return `You are analyzing a YouTube video transcript about immigration/migration to ${destination}.

VIDEO TITLE: ${videoTitle}

TRANSCRIPT:
${transcript}

Analyze this video and extract the most useful information for someone planning to move to ${destination}.

Provide:

1. **Summary** (2-3 sentences): What is this video about? Focus on actionable migration advice, visa processes, practical tips, or real experiences. Be specific and helpful.

2. **Key Timestamps** (exactly 3): Identify the 3 most important moments in the video. For each, provide:
   - Time in MM:SS format (estimate based on transcript flow)
   - Topic: What's discussed at this timestamp (be specific: "Work visa requirements explained" not just "visa info")

3. **You'll Learn** (1 sentence): What concrete, actionable knowledge will viewers gain? Focus on practical takeaways.

IMPORTANT:
- Focus on migration-specific content (visas, housing, jobs, settling, documents, costs)
- Skip generic travel/tourism info unless directly relevant to moving
- Be specific: "How to apply for skilled worker visa" > "Visa information"
- Timestamps should be evenly distributed (beginning, middle, end)
- If the video isn't about migration, say so in the summary

Return ONLY a JSON object, no markdown formatting:
{
  "summary": "2-3 sentence summary focusing on migration advice",
  "keyTimestamps": [
    {"time": "2:15", "topic": "Work visa application process breakdown"},
    {"time": "8:30", "topic": "Required documents checklist"},
    {"time": "14:45", "topic": "Common rejection reasons to avoid"}
  ],
  "youllLearn": "One sentence on concrete takeaways"
}`;
}

/**
 * Get cached video analysis from Convex
 */
async function getCachedAnalysis(videoId: string): Promise<AnalyzedVideo | null> {
  try {
    const cached = await convex.query(api.corridorFeed.getVideoAnalysis, {
      videoId,
    });

    if (!cached) return null;

    return {
      videoId: cached.videoId,
      transcript: cached.transcript,
      analysis: cached.aiSummary,
      cachedAt: cached.cachedAt,
    };
  } catch (error) {
    console.error("Error getting cached video analysis:", error);
    return null;
  }
}

/**
 * Cache video analysis in Convex (7-day TTL)
 */
async function cacheAnalysis(
  videoId: string,
  transcript: string,
  analysis: VideoAnalysis
): Promise<void> {
  try {
    await convex.mutation(api.corridorFeed.cacheVideoAnalysis, {
      videoId,
      transcript,
      aiSummary: analysis,
    });
  } catch (error) {
    console.error("Error caching video analysis:", error);
  }
}

/**
 * Batch analyze multiple videos
 * Analyzes sequentially to avoid rate limiting
 */
export async function analyzeVideos(
  videos: Array<{ videoId: string; title: string }>,
  destination: string,
  options: {
    maxAnalyses?: number;
    debugLog?: (msg: string) => void;
  } = {}
): Promise<Map<string, VideoAnalysis>> {
  const { maxAnalyses = 5, debugLog } = options;
  const log = debugLog || console.log;

  const analyses = new Map<string, VideoAnalysis>();

  // Limit number of analyses to stay within free tier
  const videosToAnalyze = videos.slice(0, maxAnalyses);

  log(`Analyzing ${videosToAnalyze.length} videos...`);

  for (const video of videosToAnalyze) {
    const analysis = await analyzeVideoTranscript(
      video.videoId,
      video.title,
      destination,
      log
    );

    if (analysis) {
      analyses.set(video.videoId, analysis);
    }

    // Small delay between analyses to be respectful
    await new Promise((r) => setTimeout(r, 1000));
  }

  log(`Completed ${analyses.size}/${videosToAnalyze.length} video analyses`);

  return analyses;
}

/**
 * Format timestamp for display
 * Converts seconds to MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse timestamp string to seconds
 * "2:15" -> 135
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}
