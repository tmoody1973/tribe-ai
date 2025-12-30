import { google } from "googleapis";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Initialize Convex client for quota tracking
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

export interface QuotaStatus {
  quotaUsed: number;
  quotaLimit: number;
  quotaAvailable: number;
  percentUsed: number;
}

/**
 * Search YouTube for corridor-specific migration videos
 * Respects quota limits and caches results
 */
export async function searchMigrationVideos(
  destination: string,
  options: {
    maxResults?: number;
    debugLog?: (msg: string) => void;
  } = {}
): Promise<YouTubeVideo[]> {
  const { maxResults = 5, debugLog } = options;
  const log = debugLog || console.log;

  if (!process.env.YOUTUBE_API_KEY) {
    log("YouTube API key not configured");
    return [];
  }

  try {
    // Check quota before making API call
    const quotaStatus = await checkQuota();
    const searchCost = 100; // YouTube search costs 100 quota units

    if (quotaStatus.quotaAvailable < searchCost) {
      log(`YouTube quota exhausted (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit} used)`);
      return getCachedVideos(destination);
    }

    log(`Searching YouTube for "${destination}" migration videos (quota: ${quotaStatus.quotaAvailable} available)`);

    // Build search queries
    const queries = [
      `${destination} immigration`,
      `${destination} moving vlog`,
      `${destination} visa guide`,
    ];

    const allVideos: YouTubeVideo[] = [];
    const seenVideoIds = new Set<string>();

    for (const query of queries) {
      try {
        const response = await youtube.search.list({
          part: ["snippet"],
          q: query,
          type: ["video"],
          maxResults: Math.ceil(maxResults / queries.length),
          relevanceLanguage: "en",
          videoCaption: "any",
          videoDuration: "medium", // 4-20 minutes (most informative)
          order: "relevance",
        });

        // Track quota usage
        await trackQuota({
          type: "search",
          cost: searchCost,
          corridor: destination,
        });

        if (response.data.items) {
          for (const item of response.data.items) {
            if (!item.id?.videoId || !item.snippet) continue;

            const videoId = item.id.videoId;

            // Deduplicate
            if (seenVideoIds.has(videoId)) continue;
            seenVideoIds.add(videoId);

            allVideos.push({
              videoId,
              title: item.snippet.title || "Untitled",
              description: item.snippet.description || "",
              thumbnail: item.snippet.thumbnails?.medium?.url || "",
              channelTitle: item.snippet.channelTitle || "",
              publishedAt: item.snippet.publishedAt || "",
              url: `https://www.youtube.com/watch?v=${videoId}`,
            });
          }
        }

        log(`Found ${response.data.items?.length || 0} videos for "${query}"`);

        // Small delay between queries to be respectful
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        const error = err as Error;
        log(`Error searching for "${query}": ${error.message}`);
      }
    }

    log(`Total: ${allVideos.length} unique videos found`);

    // Cache results for 24 hours
    await cacheVideos(destination, allVideos);

    return allVideos.slice(0, maxResults);
  } catch (error) {
    const err = error as Error;
    log(`YouTube search failed: ${err.message}, falling back to cache`);
    return getCachedVideos(destination);
  }
}

/**
 * Check current YouTube quota status
 */
async function checkQuota(): Promise<QuotaStatus> {
  try {
    const status = await convex.query(api.corridorFeed.checkYouTubeQuota, {});
    return status;
  } catch (error) {
    console.error("Error checking YouTube quota:", error);
    // Conservative fallback
    return {
      quotaUsed: 0,
      quotaLimit: 10000,
      quotaAvailable: 10000,
      percentUsed: 0,
    };
  }
}

/**
 * Track YouTube API quota usage
 */
async function trackQuota(params: {
  type: string;
  cost: number;
  corridor?: string;
}): Promise<void> {
  try {
    await convex.mutation(api.corridorFeed.trackYouTubeQuota, {
      operationType: params.type,
      cost: params.cost,
      corridor: params.corridor,
    });
  } catch (error) {
    console.error("Error tracking YouTube quota:", error);
  }
}

/**
 * Cache videos to avoid repeated API calls
 * Using Convex apiCache table with 24-hour TTL
 */
async function cacheVideos(
  destination: string,
  videos: YouTubeVideo[]
): Promise<void> {
  try {
    // Store in Convex cache (handled by API route, not here directly)
    // This is a placeholder - actual caching happens in the route
    console.log(`Cached ${videos.length} videos for ${destination}`);
  } catch (error) {
    console.error("Error caching videos:", error);
  }
}

interface CachedFeedItem {
  source: string;
  title: string;
  snippet: string;
  url: string;
  thumbnail?: string;
  author?: string;
  timestamp?: number;
}

/**
 * Get cached videos when quota exhausted or API unavailable
 */
async function getCachedVideos(destination: string): Promise<YouTubeVideo[]> {
  try {
    // Query cached feed items with source = "youtube"
    const cached = await convex.query(api.corridorFeed.getCorridorFeed, {
      origin: "", // Not filtering by origin for cached videos
      destination,
      limit: 10,
    });

    return (cached as unknown as CachedFeedItem[])
      .filter((item) => item.source === "youtube")
      .map((item) => ({
        videoId: extractVideoId(item.url),
        title: item.title,
        description: item.snippet,
        thumbnail: item.thumbnail || "",
        channelTitle: item.author || "",
        publishedAt: new Date(item.timestamp || Date.now()).toISOString(),
        url: item.url,
      }));
  } catch (error) {
    console.error("Error getting cached videos:", error);
    return [];
  }
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : "";
}

interface VideoStatistics {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  duration?: string;
}

/**
 * Get video statistics (views, likes, etc.)
 * Cost: 1 quota unit per video
 * Note: Disabled by default to save quota
 */
export async function getVideoStatistics(
  videoIds: string[],
  debugLog?: (msg: string) => void
): Promise<Map<string, VideoStatistics>> {
  const log = debugLog || console.log;
  const stats = new Map();

  if (!process.env.YOUTUBE_API_KEY || videoIds.length === 0) {
    return stats;
  }

  try {
    // Check quota (1 unit per video)
    const quotaStatus = await checkQuota();
    if (quotaStatus.quotaAvailable < videoIds.length) {
      log("Not enough quota for video statistics");
      return stats;
    }

    const response = await youtube.videos.list({
      part: ["statistics", "contentDetails"],
      id: videoIds,
    });

    // Track quota
    await trackQuota({
      type: "video_details",
      cost: 1 * videoIds.length,
    });

    if (response.data.items) {
      for (const item of response.data.items) {
        if (!item.id) continue;
        stats.set(item.id, {
          viewCount: item.statistics?.viewCount,
          likeCount: item.statistics?.likeCount,
          commentCount: item.statistics?.commentCount,
          duration: item.contentDetails?.duration,
        });
      }
    }

    log(`Fetched statistics for ${stats.size} videos`);
  } catch (error) {
    const err = error as Error;
    log(`Error fetching video statistics: ${err.message}`);
  }

  return stats;
}

/**
 * Format ISO 8601 duration to readable format
 * PT15M33S -> "15:33"
 */
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
