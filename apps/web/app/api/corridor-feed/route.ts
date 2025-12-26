import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Convert country codes to full names for Reddit search
function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    US: "United States",
    JP: "Japan",
    DE: "Germany",
    GB: "United Kingdom",
    UK: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    FR: "France",
    IT: "Italy",
    ES: "Spain",
    PT: "Portugal",
    NL: "Netherlands",
    BE: "Belgium",
    CH: "Switzerland",
    AT: "Austria",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    IE: "Ireland",
    NZ: "New Zealand",
    SG: "Singapore",
    HK: "Hong Kong",
    KR: "South Korea",
    CN: "China",
    IN: "India",
    BR: "Brazil",
    MX: "Mexico",
    AR: "Argentina",
    CL: "Chile",
    CO: "Colombia",
    PE: "Peru",
    ZA: "South Africa",
    NG: "Nigeria",
    KE: "Kenya",
    GH: "Ghana",
    EG: "Egypt",
    MA: "Morocco",
    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
    IL: "Israel",
    TR: "Turkey",
    RU: "Russia",
    PL: "Poland",
    CZ: "Czech Republic",
    HU: "Hungary",
    RO: "Romania",
    GR: "Greece",
    TH: "Thailand",
    VN: "Vietnam",
    PH: "Philippines",
    MY: "Malaysia",
    ID: "Indonesia",
    TW: "Taiwan",
  };

  // If it's already a full name (more than 3 characters), return as-is
  if (code.length > 3) return code;

  return countryNames[code.toUpperCase()] || code;
}

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

// Fetch recent posts from a subreddit (more reliable than search)
async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 10
): Promise<RedditPost[]> {
  const results: RedditPost[] = [];

  try {
    // Fetch "new" posts which is more reliable than search
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.log(`Reddit returned ${response.status} for r/${subreddit}`);
      return results;
    }

    const data = await response.json();

    if (data.data?.children) {
      for (const child of data.data.children) {
        const post = child.data;
        if (post.title) {
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
    }
  } catch (e) {
    console.error(`Error fetching r/${subreddit}:`, e);
  }

  return results;
}

// Filter posts relevant to a migration corridor
function filterRelevantPosts(
  posts: RedditPost[],
  origin: string,
  destination: string
): RedditPost[] {
  const originLower = origin.toLowerCase();
  const destLower = destination.toLowerCase();

  // Keywords that make a post relevant
  const keywords = [
    "visa", "move", "moving", "relocate", "relocating", "immigration",
    "expat", "working", "job", "apartment", "housing", "cost of living",
    "experience", "advice", "help", "question", "tips"
  ];

  return posts.filter((post) => {
    const text = (post.title + " " + post.selftext).toLowerCase();

    // Check if post mentions the destination or origin
    const mentionsDestination = text.includes(destLower) ||
      text.includes(destination.split(" ")[0].toLowerCase());
    const mentionsOrigin = text.includes(originLower) ||
      text.includes(origin.split(" ")[0].toLowerCase());

    // Check if post has relevant keywords
    const hasKeyword = keywords.some((kw) => text.includes(kw));

    // For destination-specific subreddits, any post with keywords is relevant
    // For general subreddits, needs to mention destination
    return hasKeyword || mentionsDestination || mentionsOrigin;
  });
}

async function fetchRedditPosts(
  subreddits: string[],
  origin: string,
  destination: string
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];

  // Fetch from multiple subreddits in parallel
  const fetchPromises = subreddits.slice(0, 5).map(async (subreddit) => {
    await new Promise((r) => setTimeout(r, Math.random() * 200)); // Stagger requests
    return fetchSubredditPosts(subreddit, 15);
  });

  const results = await Promise.all(fetchPromises);

  for (const posts of results) {
    allPosts.push(...posts);
  }

  // Filter for relevant posts
  const relevantPosts = filterRelevantPosts(allPosts, origin, destination);

  console.log(`Fetched ${allPosts.length} total posts, ${relevantPosts.length} relevant`);

  // If we have relevant posts, return those; otherwise return recent posts
  return relevantPosts.length > 0 ? relevantPosts : allPosts.slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const originCode = searchParams.get("origin");
  const destinationCode = searchParams.get("destination");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!originCode || !destinationCode) {
    return NextResponse.json(
      { error: "Origin and destination required" },
      { status: 400 }
    );
  }

  // Convert country codes to full names for Reddit search
  const origin = getCountryName(originCode);
  const destination = getCountryName(destinationCode);

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

    // Build subreddit list - prioritize destination-specific subreddits
    const countrySubreddits = COUNTRY_SUBREDDITS[destination] || [];
    const subreddits = [...countrySubreddits, ...MIGRATION_SUBREDDITS];

    console.log(`Fetching posts for ${origin} → ${destination} from subreddits:`, subreddits.slice(0, 5));

    // Fetch from Reddit (new approach: fetch recent posts and filter)
    const allPosts = await fetchRedditPosts(subreddits, origin, destination);

    console.log(`Got ${allPosts.length} posts from Reddit`);

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
