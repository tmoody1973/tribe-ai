import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RedditPost {
  title: string;
  selftext: string;
  author: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
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

// Build search queries for a corridor
function buildSearchQueries(origin: string, destination: string): string[] {
  const destLower = destination.toLowerCase();
  const originLower = origin.toLowerCase();

  return [
    `${originLower} to ${destLower}`,
    `moving to ${destLower} from ${originLower}`,
    `${destLower} visa ${originLower}`,
    `${destLower} immigration`,
    `relocating to ${destLower}`,
    `expat ${destLower}`,
  ];
}

// Relevant subreddits for migration
const MIGRATION_SUBREDDITS = [
  "IWantOut",
  "expats",
  "immigration",
  "digitalnomad",
  "AmerExit",
  "movingtojapan",
  "germany",
  "AskUK",
  "canada",
  "iwanttobeabroad",
];

// Country-specific subreddits
const COUNTRY_SUBREDDITS: Record<string, string[]> = {
  Germany: ["germany", "Berlin", "Munich", "de"],
  "United Kingdom": ["AskUK", "ukvisa", "London"],
  Canada: ["canada", "ImmigrationCanada", "PersonalFinanceCanada"],
  Australia: ["australia", "AusVisa", "sydney", "melbourne"],
  Japan: ["movingtojapan", "japanlife", "teachinginjapan"],
  "United States": ["USCIS", "immigration", "h1b"],
  Netherlands: ["Netherlands", "Amsterdam"],
  France: ["france", "paris", "French"],
  Spain: ["spain", "Madrid", "Barcelona"],
  Portugal: ["portugal", "Lisbon"],
  Singapore: ["singapore", "askSingapore"],
  UAE: ["dubai", "UAE"],
  "South Korea": ["korea", "Living_in_Korea"],
  Ireland: ["ireland", "Dublin"],
  "New Zealand": ["newzealand"],
};

async function fetchRedditPosts(
  query: string,
  subreddits: string[],
  limit: number = 5
): Promise<RedditPost[]> {
  const results: RedditPost[] = [];

  for (const subreddit of subreddits.slice(0, 3)) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=${limit}&sort=new&t=month`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "TRIBE/1.0 (Diaspora Intelligence Network)",
        },
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.data?.children) {
        for (const child of data.data.children) {
          const post = child.data;
          results.push({
            title: post.title,
            selftext: post.selftext || "",
            author: post.author,
            permalink: post.permalink,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            subreddit: post.subreddit,
          });
        }
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.error(`Error fetching r/${subreddit}:`, e);
    }
  }

  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination required" },
      { status: 400 }
    );
  }

  try {
    // Check if we need to refresh
    const needsRefresh = forceRefresh || await convex.query(api.corridorFeed.needsRefresh, {
      origin,
      destination,
    });

    if (!needsRefresh) {
      // Return cached feed
      const cachedFeed = await convex.query(api.corridorFeed.getCorridorFeed, {
        origin,
        destination,
        limit: 15,
      });

      const stats = await convex.query(api.corridorFeed.getCorridorStats, {
        origin,
        destination,
      });

      return NextResponse.json({
        items: cachedFeed,
        stats,
        cached: true,
      });
    }

    // Build subreddit list
    const countrySubreddits = COUNTRY_SUBREDDITS[destination] || [];
    const subreddits = [...MIGRATION_SUBREDDITS, ...countrySubreddits];

    // Build queries
    const queries = buildSearchQueries(origin, destination);

    // Fetch from Reddit
    const allPosts: RedditPost[] = [];

    for (const query of queries.slice(0, 2)) {
      const posts = await fetchRedditPosts(query, subreddits, 5);
      allPosts.push(...posts);
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniquePosts = allPosts.filter((post) => {
      const url = `https://reddit.com${post.permalink}`;
      if (seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    });

    // Sort by score and recency
    uniquePosts.sort((a, b) => {
      // Prioritize recent high-engagement posts
      const aScore = a.score + a.num_comments * 2;
      const bScore = b.score + b.num_comments * 2;
      return bScore - aScore;
    });

    // Convert to feed items
    const feedItems: FeedItem[] = uniquePosts.slice(0, 15).map((post) => {
      const alert = detectAlert(post.title, post.selftext);
      return {
        source: "reddit" as const,
        title: post.title,
        snippet: post.selftext.slice(0, 200) + (post.selftext.length > 200 ? "..." : ""),
        url: `https://reddit.com${post.permalink}`,
        author: post.author,
        subreddit: post.subreddit,
        upvotes: post.score,
        comments: post.num_comments,
        ...alert,
      };
    });

    // Save to Convex
    for (const item of feedItems) {
      try {
        await convex.mutation(api.corridorFeed.saveFeedItem, {
          origin,
          destination,
          ...item,
        });
      } catch (e) {
        console.error("Error saving feed item:", e);
      }
    }

    // Get stats
    const stats = await convex.query(api.corridorFeed.getCorridorStats, {
      origin,
      destination,
    });

    return NextResponse.json({
      items: feedItems,
      stats,
      cached: false,
      refreshedAt: Date.now(),
    });
  } catch (error) {
    console.error("Corridor feed error:", error);

    // Return cached data on error
    try {
      const cachedFeed = await convex.query(api.corridorFeed.getCorridorFeed, {
        origin,
        destination,
        limit: 15,
      });

      const stats = await convex.query(api.corridorFeed.getCorridorStats, {
        origin,
        destination,
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
