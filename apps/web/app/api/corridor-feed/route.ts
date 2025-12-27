import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import FirecrawlApp from "@mendable/firecrawl-js";
import { analyzeRelevance, type UserContext } from "@/lib/gemini-relevance";
import { searchMigrationVideos } from "@/lib/youtube";
import { analyzeVideos, type VideoAnalysis } from "@/lib/gemini-video";
import fs from "fs";
import path from "path";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

// Load migration data from JSON file
interface SubredditInfo {
  name: string;
  url: string;
  type: string;
  language?: string;
  notes?: string;
}

interface CountryData {
  country: string;
  isoCode: string;
  subreddits: SubredditInfo[];
}

interface RegionData {
  name: string;
  countries: CountryData[];
}

interface MigrationData {
  regions: RegionData[];
  global_migration_subreddits: SubredditInfo[];
  migration_forums: Array<{
    name: string;
    url: string;
    type: string;
    country?: string;
    isoCode?: string;
    scrapable?: boolean;
    notes?: string;
  }>;
}

let migrationData: MigrationData | null = null;

function loadMigrationData(): MigrationData {
  if (migrationData) return migrationData;

  try {
    const filePath = path.join(process.cwd(), "docs", "migration_app_complete.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    migrationData = JSON.parse(fileContent);
    return migrationData!;
  } catch (e) {
    console.error("Error loading migration data:", e);
    return { regions: [], global_migration_subreddits: [], migration_forums: [] };
  }
}

// Get country name from ISO code
function getCountryName(code: string): string {
  const data = loadMigrationData();

  // Search through regions to find country by ISO code
  for (const region of data.regions) {
    for (const country of region.countries) {
      if (country.isoCode.toUpperCase() === code.toUpperCase()) {
        return country.country;
      }
    }
  }

  // Fallback mapping for common codes
  const fallbackNames: Record<string, string> = {
    US: "United States",
    UK: "United Kingdom",
    GB: "United Kingdom",
  };

  return fallbackNames[code.toUpperCase()] || code;
}

// Get subreddits for a country from the JSON data
function getSubredditsForCountry(isoCode: string): SubredditInfo[] {
  const data = loadMigrationData();

  for (const region of data.regions) {
    for (const country of region.countries) {
      if (country.isoCode.toUpperCase() === isoCode.toUpperCase()) {
        return country.subreddits;
      }
    }
  }

  return [];
}

// Get global migration subreddits
function getGlobalSubreddits(): SubredditInfo[] {
  const data = loadMigrationData();
  return data.global_migration_subreddits || [];
}

// Get expat forums for a country
function getExpatForums(isoCode: string): Array<{ name: string; url: string }> {
  const data = loadMigrationData();

  return data.migration_forums
    .filter((forum) => forum.isoCode?.toUpperCase() === isoCode.toUpperCase() && forum.scrapable)
    .map((forum) => ({ name: forum.name, url: forum.url }));
}

interface FeedItem {
  source: "reddit" | "forum" | "news" | "official" | "youtube";
  type?: string;
  title: string;
  snippet: string;
  url: string;
  author?: string;
  subreddit?: string;
  upvotes?: number;
  comments?: number;
  isAlert?: boolean;
  alertType?: "opportunity" | "warning" | "update";
  thumbnail?: string;
  timestamp?: number;
  relevanceScore?: number;
  stageScore?: number;
  aiReason?: string;
  aiSummary?: {
    summary: string;
    keyTimestamps: Array<{
      time: string;
      topic: string;
    }>;
    youllLearn: string;
  };
}

// Detect alerts in post content
function detectAlert(title: string, content: string): { isAlert: boolean; alertType?: "opportunity" | "warning" | "update" } {
  const text = (title + " " + content).toLowerCase();

  // Opportunity keywords
  if (
    text.includes("slots opened") ||
    text.includes("appointment available") ||
    text.includes("new visa") ||
    text.includes("fast track") ||
    text.includes("urgent hire") ||
    text.includes("job opening")
  ) {
    return { isAlert: true, alertType: "opportunity" };
  }

  // Warning keywords
  if (
    text.includes("scam") ||
    text.includes("warning") ||
    text.includes("avoid") ||
    text.includes("rejected") ||
    text.includes("denied") ||
    text.includes("fraud")
  ) {
    return { isAlert: true, alertType: "warning" };
  }

  // Update keywords
  if (
    text.includes("new requirement") ||
    text.includes("policy change") ||
    text.includes("fee increase") ||
    text.includes("rule change") ||
    text.includes("update:")
  ) {
    return { isAlert: true, alertType: "update" };
  }

  return { isAlert: false };
}

// Fetch Reddit posts using their free JSON API (no auth needed!)
async function fetchRedditPosts(subreddit: SubredditInfo, debugLog?: (msg: string) => void): Promise<FeedItem[]> {
  const log = debugLog || console.log;

  try {
    const url = `https://www.reddit.com/r/${subreddit.name}/new.json?limit=15`;
    log(`Fetching ${url}...`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      log(`Reddit API error for r/${subreddit.name}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const posts: FeedItem[] = [];

    if (data?.data?.children) {
      for (const child of data.data.children) {
        const post = child.data;
        if (!post.title) continue;

        const alert = detectAlert(post.title, post.selftext || "");
        posts.push({
          source: "reddit",
          title: post.title,
          snippet: (post.selftext || "").slice(0, 200),
          url: `https://reddit.com${post.permalink}`,
          author: post.author,
          subreddit: subreddit.name,
          upvotes: post.ups,
          comments: post.num_comments,
          ...alert,
        });
      }
    }

    log(`Found ${posts.length} posts from r/${subreddit.name}`);
    return posts;
  } catch (e) {
    const error = e as Error;
    log(`Error fetching r/${subreddit.name}: ${error.message}`);
    return [];
  }
}

// Scrape an expat forum using Firecrawl
async function scrapeExpatForum(forum: { name: string; url: string }, countryName: string, debugLog?: (msg: string) => void): Promise<FeedItem[]> {
  const log = debugLog || console.log;

  try {
    log(`Scraping forum ${forum.name}...`);

    const result = await firecrawl.scrape(forum.url, {
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000,
    });

    if (!result.markdown) {
      log(`Failed to scrape ${forum.name}: No content`);
      return [];
    }

    log(`Scraped ${result.markdown.length} chars from ${forum.name}`);

    // Parse forum posts (similar structure to Reddit parsing)
    const posts: FeedItem[] = [];
    const lines = result.markdown.split("\n");

    for (const line of lines) {
      const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
      if (linkMatch) {
        const title = linkMatch[1];
        const url = linkMatch[2];

        // Skip image URLs (banners, avatars, etc.)
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/i)) {
          continue;
        }

        // Skip non-forum URLs (ads, external sites)
        if (!url.includes('expatforum.com/threads/')) {
          continue;
        }

        // Filter for relevant topics (contains country name or migration keywords)
        const titleLower = title.toLowerCase();
        const countryLower = countryName.toLowerCase();

        if (
          titleLower.includes(countryLower) ||
          titleLower.includes("visa") ||
          titleLower.includes("move") ||
          titleLower.includes("relocat") ||
          titleLower.includes("expat") ||
          titleLower.includes("immigrat")
        ) {
          const alert = detectAlert(title, "");
          posts.push({
            source: "forum",
            title,
            snippet: "",
            url,
            ...alert,
          });
        }
      }
    }

    log(`Found ${posts.length} relevant forum posts from ${forum.name}`);
    return posts.slice(0, 5); // Limit forum posts
  } catch (e) {
    const error = e as Error;
    log(`Error scraping forum ${forum.name}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch migration content using Perplexity AI (searches web + Reddit)
 */
async function fetchMigrationNews(
  origin: string,
  destination: string,
  debugLog?: (msg: string) => void
): Promise<FeedItem[]> {
  const log = debugLog || console.log;

  try {
    // Perplexity can search Reddit, news sites, and official sources all at once
    const query = `Search Reddit (r/IWantOut, r/${destination.toLowerCase()}), news sites, and official government sources for recent posts and articles about immigrating or moving from ${origin} to ${destination}. Include visa updates, job opportunities, housing tips, and expat experiences.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a migration content aggregator. Search Reddit, news sites, and official sources for immigration information. Return results as a JSON array with: title, snippet (1-2 sentences), url, source (reddit/news/official), and isAlert (boolean for urgent updates). Include 5-10 most relevant recent results.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Perplexity response");
    }

    log(`Perplexity raw response: ${content.substring(0, 200)}...`);

    // Try to extract JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      log("Perplexity returned no structured results");
      return [];
    }

    const newsResults = JSON.parse(jsonMatch[0]);
    log(`Perplexity returned ${newsResults.length} results`);

    return newsResults.slice(0, 10).map((item: {
      title: string;
      snippet: string;
      url: string;
      source?: string;
      isAlert?: boolean;
    }) => ({
      source: (item.source === "official" ? "official" :
               item.source === "reddit" ? "reddit" :
               "news") as "reddit" | "news" | "official",
      title: item.title || "Untitled",
      snippet: item.snippet || "",
      url: item.url || "",
      isAlert: item.isAlert || false,
      alertType: item.isAlert ? ("update" as const) : undefined,
    }));
  } catch (error) {
    const err = error as Error;
    log(`Perplexity fetch error: ${err.message}`);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const originCode = searchParams.get("origin");
  const destinationCode = searchParams.get("destination");
  const forceRefresh = searchParams.get("refresh") === "true";
  const debug = searchParams.get("debug") === "true";

  if (!originCode || !destinationCode) {
    return NextResponse.json(
      { error: "Origin and destination required" },
      { status: 400 }
    );
  }

  // Convert country codes to full names
  const origin = getCountryName(originCode);
  const destination = getCountryName(destinationCode);

  const debugLog: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    if (debug) debugLog.push(msg);
  };

  log(`Corridor feed request: ${origin} (${originCode}) → ${destination} (${destinationCode})`);

  try {
    // Check if we need to refresh (use original codes for cache key)
    const needsRefresh = forceRefresh || await convex.query(api.corridorFeed.needsRefresh, {
      origin: originCode,
      destination: destinationCode,
    });

    if (!needsRefresh) {
      // Return cached feed
      const cachedFeed = await convex.query(api.corridorFeed.getCorridorFeed, {
        origin: originCode,
        destination: destinationCode,
        limit: 15,
      });

      const stats = await convex.query(api.corridorFeed.getCorridorStats, {
        origin: originCode,
        destination: destinationCode,
      });

      return NextResponse.json({
        items: cachedFeed,
        stats,
        cached: true,
      });
    }

    // Get subreddits for destination country
    const countrySubreddits = getSubredditsForCountry(destinationCode);
    const globalSubreddits = getGlobalSubreddits();
    const expatForums = getExpatForums(destinationCode);

    log(`Found ${countrySubreddits.length} country subreddits, ${globalSubreddits.length} global subreddits, ${expatForums.length} forums`);

    // Collect all feed items
    const allItems: FeedItem[] = [];

    // Note: Firecrawl is optional - we use Reddit's free JSON API for Reddit posts
    // Firecrawl is only needed for forum scraping
    if (!process.env.FIRECRAWL_API_KEY) {
      log("Firecrawl API key not configured - skipping forum scraping");
    }

    // NOTE: Reddit scraping removed - now handled by Perplexity API
    // Perplexity searches Reddit + news + official sources all at once

    // Scrape expat forums using Firecrawl (limit to 1)
    if (expatForums.length > 0 && process.env.FIRECRAWL_API_KEY) {
      const forumPosts = await scrapeExpatForum(expatForums[0], destination, log);
      allItems.push(...forumPosts);
    } else if (expatForums.length > 0) {
      log("Skipping forum scraping - Firecrawl API key not configured");
    }

    // Fetch YouTube videos (Story 8.3)
    if (process.env.YOUTUBE_API_KEY) {
      try {
        log("Searching YouTube for migration videos...");
        const videos = await searchMigrationVideos(destination, {
          maxResults: 5,
          debugLog: log,
        });

        // Analyze video transcripts with Gemini (Story 8.4)
        let videoAnalyses = new Map<string, VideoAnalysis>();
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && videos.length > 0) {
          try {
            log(`Analyzing ${videos.length} video transcripts with Gemini...`);
            videoAnalyses = await analyzeVideos(
              videos.map(v => ({ videoId: v.videoId, title: v.title })),
              destination,
              {
                maxAnalyses: 5,
                debugLog: log,
              }
            );
            log(`Successfully analyzed ${videoAnalyses.size} videos`);
          } catch (error) {
            const err = error as Error;
            log(`Video analysis error: ${err.message}, continuing without AI summaries`);
          }
        }

        // Convert videos to feed items with AI summaries
        for (const video of videos) {
          const analysis = videoAnalyses.get(video.videoId);

          allItems.push({
            source: "youtube",
            type: "video",
            title: video.title,
            snippet: video.description.slice(0, 300), // Limit description length
            url: video.url,
            thumbnail: video.thumbnail,
            author: video.channelTitle,
            timestamp: new Date(video.publishedAt).getTime(),
            isAlert: false,
            // Add AI summary if available
            ...(analysis && {
              aiSummary: analysis,
            }),
          });
        }

        log(`Added ${videos.length} YouTube videos to feed`);
      } catch (error) {
        const err = error as Error;
        log(`YouTube search error: ${err.message}`);
      }
    } else {
      log("YouTube API key not configured - skipping video search");
    }

    // Fetch migration news and official sources using Perplexity AI
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        log("Searching for migration news with Perplexity AI...");
        const newsItems = await fetchMigrationNews(origin, destination, log);
        allItems.push(...newsItems);
        log(`Added ${newsItems.length} news/official sources from Perplexity`);
      } catch (error) {
        const err = error as Error;
        log(`Perplexity search error: ${err.message}`);
      }
    } else {
      log("Perplexity API key not configured - skipping news search");
    }

    log(`Total items collected: ${allItems.length}`);

    // NEW: AI-Powered Relevance Analysis (Story 8.2.5)
    let analyzedItems = allItems;

    if (allItems.length > 0) {
      try {
        // Determine user's journey stage (default to "planning" if not available)
        // TODO: Get actual stage from user profile
        const userStage: UserContext["stage"] = "planning";

        log(`Analyzing ${allItems.length} items with Gemini AI...`);
        analyzedItems = await analyzeRelevance(
          allItems,
          {
            origin,
            destination,
            stage: userStage,
          },
          log
        );

        log(`AI filtered to ${analyzedItems.length} relevant items (removed ${allItems.length - analyzedItems.length} low-relevance items)`);
      } catch (error) {
        const err = error as Error;
        log(`AI analysis error: ${err.message}, continuing with unfiltered items`);
        analyzedItems = allItems;
      }
    }

    // If no items scraped or all filtered out, add helpful sample data
    if (analyzedItems.length === 0) {
      log("No items scraped or all filtered out, adding sample data");
      analyzedItems.push({
        source: "reddit",
        title: `Moving to ${destination} - Visa Timeline Questions`,
        snippet: `Has anyone recently moved from ${origin} to ${destination}? Looking for timeline estimates for the application process...`,
        url: `https://reddit.com/r/iwantout`,
        subreddit: "IWantOut",
        isAlert: false,
        relevanceScore: 80,
        stageScore: 90,
        aiReason: "Sample data for empty feed",
      });
      analyzedItems.push({
        source: "reddit",
        title: `${destination} Housing Market Update`,
        snippet: "Latest updates on rental prices and availability in major cities. Things have been changing rapidly...",
        url: `https://reddit.com/r/${destination.toLowerCase()}`,
        isAlert: true,
        alertType: "update",
        relevanceScore: 70,
        stageScore: 60,
        aiReason: "Sample data for empty feed",
      });
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueItems = analyzedItems.filter((item) => {
      if (seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });

    // Sort by relevance score (if available), then by timestamp
    const sortedItems = uniqueItems.sort((a, b) => {
      const scoreA = a.relevanceScore || 0;
      const scoreB = b.relevanceScore || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    // Take top 15 items
    const feedItems = sortedItems.slice(0, 15);

    // Save to Convex (use codes for storage) with AI scores
    for (const item of feedItems) {
      try {
        await convex.mutation(api.corridorFeed.saveFeedItem, {
          origin: originCode,
          destination: destinationCode,
          // Feed item fields (explicitly listed - DO NOT use ...item spread)
          source: item.source,
          title: item.title,
          snippet: item.snippet,
          url: item.url,
          type: item.type,
          thumbnail: item.thumbnail,
          author: item.author,
          subreddit: item.subreddit,
          upvotes: item.upvotes,
          comments: item.comments,
          isAlert: item.isAlert,
          alertType: item.alertType,
          // AI analysis fields
          relevanceScore: item.relevanceScore,
          stageScore: item.stageScore,
          aiReason: item.aiReason,
          aiSummary: item.aiSummary,
        });
      } catch (e) {
        console.error("Error saving feed item:", e);
      }
    }

    // Get stats (use codes)
    const stats = await convex.query(api.corridorFeed.getCorridorStats, {
      origin: originCode,
      destination: destinationCode,
    });

    return NextResponse.json({
      items: feedItems,
      stats,
      cached: false,
      refreshedAt: Date.now(),
      ...(debug && { debug: debugLog }),
    });
  } catch (error) {
    console.error("Corridor feed error:", error);

    // Return cached data on error (use codes)
    try {
      const cachedFeed = await convex.query(api.corridorFeed.getCorridorFeed, {
        origin: originCode,
        destination: destinationCode,
        limit: 15,
      });

      const stats = await convex.query(api.corridorFeed.getCorridorStats, {
        origin: originCode,
        destination: destinationCode,
      });

      return NextResponse.json({
        items: cachedFeed,
        stats,
        cached: true,
        error: "Failed to refresh, showing cached data",
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch corridor feed", items: [], stats: null },
        { status: 500 }
      );
    }
  }
}
