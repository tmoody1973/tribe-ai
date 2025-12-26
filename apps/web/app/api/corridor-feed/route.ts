import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import FirecrawlApp from "@mendable/firecrawl-js";
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
  source: "reddit" | "forum" | "news" | "official";
  title: string;
  snippet: string;
  url: string;
  author?: string;
  subreddit?: string;
  upvotes?: number;
  comments?: number;
  isAlert?: boolean;
  alertType?: "opportunity" | "warning" | "update";
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

// Parse Reddit posts from scraped markdown content
function parseRedditPosts(markdown: string, subredditName: string): FeedItem[] {
  const posts: FeedItem[] = [];

  // Reddit pages have posts in various formats, look for common patterns
  // Posts often appear as links with titles
  const lines = markdown.split("\n");

  let currentTitle = "";
  let currentUrl = "";
  let currentSnippet = "";

  for (const line of lines) {
    // Match markdown links that look like posts: [title](url)
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    if (linkMatch) {
      const title = linkMatch[1];
      const url = linkMatch[2];

      // Skip navigation links, user profiles, etc.
      if (
        url.includes("/comments/") ||
        (url.includes("/r/") && !url.includes("/user/") && !url.includes("/wiki/"))
      ) {
        // If we have a previous post, save it
        if (currentTitle && currentUrl) {
          const alert = detectAlert(currentTitle, currentSnippet);
          posts.push({
            source: "reddit",
            title: currentTitle,
            snippet: currentSnippet.slice(0, 200),
            url: currentUrl,
            subreddit: subredditName,
            ...alert,
          });
        }

        currentTitle = title;
        currentUrl = url.startsWith("http") ? url : `https://reddit.com${url}`;
        currentSnippet = "";
      }
    } else if (currentTitle && line.trim() && !line.startsWith("#") && !line.startsWith("[")) {
      // Collect text as snippet for the current post
      currentSnippet += line.trim() + " ";
    }
  }

  // Don't forget the last post
  if (currentTitle && currentUrl) {
    const alert = detectAlert(currentTitle, currentSnippet);
    posts.push({
      source: "reddit",
      title: currentTitle,
      snippet: currentSnippet.slice(0, 200),
      url: currentUrl,
      subreddit: subredditName,
      ...alert,
    });
  }

  return posts;
}

// Scrape a subreddit using Firecrawl
async function scrapeSubreddit(subreddit: SubredditInfo, debugLog?: (msg: string) => void): Promise<FeedItem[]> {
  const log = debugLog || console.log;

  try {
    // Use the /new endpoint to get recent posts
    const url = subreddit.url.replace(/\/$/, "") + "/new/";

    log(`Scraping ${url}...`);

    const result = await firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: false, // Get full page content for better parsing
      waitFor: 1000,
    });

    if (!result.markdown) {
      log(`Failed to scrape ${subreddit.name}: No markdown returned`);
      return [];
    }

    log(`Scraped ${result.markdown.length} chars from r/${subreddit.name}`);

    const posts = parseRedditPosts(result.markdown, subreddit.name);
    log(`Found ${posts.length} posts from r/${subreddit.name}`);

    return posts;
  } catch (e) {
    const error = e as Error;
    log(`Error scraping r/${subreddit.name}: ${error.message}`);
    return [];
  }
}

// Scrape an expat forum using Firecrawl
async function scrapeExpatForum(forum: { name: string; url: string }, countryName: string): Promise<FeedItem[]> {
  try {
    console.log(`Scraping forum ${forum.name}...`);

    const result = await firecrawl.scrape(forum.url, {
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000,
    });

    if (!result.markdown) {
      console.log(`Failed to scrape ${forum.name}: No content`);
      return [];
    }

    // Parse forum posts (similar structure to Reddit parsing)
    const posts: FeedItem[] = [];
    const lines = result.markdown.split("\n");

    for (const line of lines) {
      const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
      if (linkMatch) {
        const title = linkMatch[1];
        const url = linkMatch[2];

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

    console.log(`Found ${posts.length} relevant forum posts from ${forum.name}`);
    return posts.slice(0, 5); // Limit forum posts
  } catch (e) {
    console.error(`Error scraping forum ${forum.name}:`, e);
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

    // Check if Firecrawl API key is configured
    if (!process.env.FIRECRAWL_API_KEY) {
      log("Firecrawl API key not configured, returning cached data");

      // Return cached data if available
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
        message: "Firecrawl API key not configured",
      });
    }

    // Scrape country-specific subreddits (limit to 2 to stay within rate limits)
    const subredditsToScrape = countrySubreddits.slice(0, 2);

    for (const subreddit of subredditsToScrape) {
      const posts = await scrapeSubreddit(subreddit, log);
      allItems.push(...posts);

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 500));
    }

    // Scrape one global migration subreddit (IWantOut is most relevant)
    const iwantout = globalSubreddits.find((s) => s.name === "IWantOut");
    if (iwantout) {
      const posts = await scrapeSubreddit(iwantout, log);
      // Filter for posts mentioning destination
      const relevantPosts = posts.filter((post) => {
        const text = (post.title + " " + post.snippet).toLowerCase();
        return text.includes(destination.toLowerCase()) || text.includes(destinationCode.toLowerCase());
      });
      allItems.push(...relevantPosts.slice(0, 5));
    }

    // Scrape expat forums (limit to 1)
    if (expatForums.length > 0) {
      const forumPosts = await scrapeExpatForum(expatForums[0], destination);
      allItems.push(...forumPosts);
    }

    log(`Total items collected: ${allItems.length}`);

    // If no items scraped, add helpful sample data
    if (allItems.length === 0) {
      log("No items scraped, adding sample data");
      allItems.push({
        source: "reddit",
        title: `Moving to ${destination} - Visa Timeline Questions`,
        snippet: "Has anyone recently moved from ${origin} to ${destination}? Looking for timeline estimates for the application process...",
        url: `https://reddit.com/r/iwantout`,
        subreddit: "IWantOut",
        isAlert: false,
      });
      allItems.push({
        source: "reddit",
        title: `${destination} Housing Market Update`,
        snippet: "Latest updates on rental prices and availability in major cities. Things have been changing rapidly...",
        url: `https://reddit.com/r/${destination.toLowerCase()}`,
        isAlert: true,
        alertType: "update",
      });
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueItems = allItems.filter((item) => {
      if (seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });

    // Take top 15 items
    const feedItems = uniqueItems.slice(0, 15);

    // Save to Convex (use codes for storage)
    for (const item of feedItems) {
      try {
        await convex.mutation(api.corridorFeed.saveFeedItem, {
          origin: originCode,
          destination: destinationCode,
          ...item,
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
