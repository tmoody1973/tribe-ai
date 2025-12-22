/**
 * Attribution Scoring and Selection
 *
 * Scores and selects the best attribution for protocol steps
 * based on engagement, recency, and source quality.
 */

export interface IngestedContent {
  _id: string;
  url: string;
  title: string;
  content: string;
  source: "reddit" | "forum" | "blog" | "government" | "news";
  metadata: {
    author?: string;
    publishedAt?: number;
    subreddit?: string;
  };
  scrapedAt: number;
}

export interface RawAttribution {
  sourceUrl: string;
  authorName?: string;
  engagement?: number;
  sourceDate?: number;
}

export interface ScoredAttribution extends RawAttribution {
  score: number;
}

/**
 * Score factors for attribution ranking
 */
const SCORE_WEIGHTS = {
  engagement: 0.4, // User engagement (upvotes, likes)
  recency: 0.3, // How recent the content is
  sourceQuality: 0.2, // Quality of the source (government > news > blog)
  specificity: 0.1, // How specific the attribution is
};

/**
 * Source quality scores (higher = more authoritative)
 */
const SOURCE_QUALITY: Record<string, number> = {
  government: 10,
  news: 7,
  forum: 5,
  blog: 4,
  reddit: 3,
};

/**
 * Score an attribution based on multiple factors
 */
export function scoreAttribution(
  attr: RawAttribution,
  source?: IngestedContent
): number {
  let score = 0;

  // Engagement score (normalized to 0-10)
  if (attr.engagement) {
    // Log scale for engagement (1000 upvotes = 10 points)
    const engagementScore = Math.min(Math.log10(attr.engagement + 1) * 3.33, 10);
    score += engagementScore * SCORE_WEIGHTS.engagement;
  }

  // Recency score (within last year = better)
  const publishedAt = attr.sourceDate || source?.metadata?.publishedAt;
  if (publishedAt) {
    const ageInDays = (Date.now() - publishedAt) / (1000 * 60 * 60 * 24);
    let recencyScore = 0;
    if (ageInDays < 30) recencyScore = 10;
    else if (ageInDays < 90) recencyScore = 8;
    else if (ageInDays < 180) recencyScore = 6;
    else if (ageInDays < 365) recencyScore = 4;
    else recencyScore = 2;
    score += recencyScore * SCORE_WEIGHTS.recency;
  }

  // Source quality score
  if (source?.source) {
    const qualityScore = SOURCE_QUALITY[source.source] || 5;
    score += qualityScore * SCORE_WEIGHTS.sourceQuality;
  }

  // Specificity score (has author = more specific)
  let specificityScore = 5;
  if (attr.authorName) specificityScore += 3;
  if (attr.sourceUrl) specificityScore += 2;
  score += Math.min(specificityScore, 10) * SCORE_WEIGHTS.specificity;

  return score;
}

/**
 * Select the best attribution for a protocol step
 */
export function selectBestAttribution(
  protocol: { attribution?: RawAttribution },
  allContent: IngestedContent[]
): RawAttribution | undefined {
  // If protocol already has attribution, validate and return it
  if (protocol.attribution?.sourceUrl) {
    // Try to enrich with matching content
    const matchingContent = findMatchingContent(
      protocol.attribution.sourceUrl,
      allContent
    );
    if (matchingContent) {
      return {
        ...protocol.attribution,
        authorName: protocol.attribution.authorName || matchingContent.metadata?.author,
      };
    }
    return protocol.attribution;
  }

  // No attribution provided by synthesis
  return undefined;
}

/**
 * Match content to protocol based on URL similarity
 */
export function findMatchingContent(
  sourceUrl: string,
  allContent: IngestedContent[]
): IngestedContent | undefined {
  // Normalize URL for comparison (remove fragments, trailing slashes)
  const normalizeUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
    } catch {
      return url.split("#")[0].replace(/\/$/, "");
    }
  };

  const normalizedSource = normalizeUrl(sourceUrl);

  // Exact match first
  const exactMatch = allContent.find(
    (c) => normalizeUrl(c.url) === normalizedSource
  );
  if (exactMatch) return exactMatch;

  // Partial match (same base URL)
  const partialMatch = allContent.find((c) =>
    normalizedSource.startsWith(normalizeUrl(c.url).split("#")[0])
  );
  if (partialMatch) return partialMatch;

  return undefined;
}

/**
 * Rank multiple attributions and return sorted by score
 */
export function rankAttributions(
  attributions: RawAttribution[],
  allContent: IngestedContent[]
): ScoredAttribution[] {
  return attributions
    .map((attr) => {
      const matchingContent = attr.sourceUrl
        ? findMatchingContent(attr.sourceUrl, allContent)
        : undefined;
      return {
        ...attr,
        score: scoreAttribution(attr, matchingContent),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Merge multiple attributions for the same step
 * Takes the best engagement from Reddit, best authority from government sources
 */
export function mergeAttributions(
  attributions: RawAttribution[],
  allContent: IngestedContent[]
): RawAttribution | undefined {
  if (attributions.length === 0) return undefined;
  if (attributions.length === 1) return attributions[0];

  const ranked = rankAttributions(attributions, allContent);
  const best = ranked[0];

  // Find highest engagement source
  const highestEngagement = attributions.reduce(
    (max, attr) => Math.max(max, attr.engagement ?? 0),
    0
  );

  return {
    sourceUrl: best.sourceUrl,
    authorName: best.authorName,
    engagement: highestEngagement > 0 ? highestEngagement : best.engagement,
    sourceDate: best.sourceDate,
  };
}

/**
 * Validate attribution data
 */
export function validateAttribution(attr: RawAttribution): boolean {
  // Must have a valid URL
  if (!attr.sourceUrl) return false;

  try {
    new URL(attr.sourceUrl);
  } catch {
    return false;
  }

  // Engagement must be non-negative if present
  if (attr.engagement !== undefined && attr.engagement < 0) return false;

  return true;
}

/**
 * Clean and normalize attribution data
 */
export function normalizeAttribution(attr: RawAttribution): RawAttribution {
  return {
    sourceUrl: attr.sourceUrl.trim(),
    authorName: attr.authorName?.trim() || undefined,
    engagement: attr.engagement !== undefined ? Math.max(0, attr.engagement) : undefined,
    sourceDate: attr.sourceDate,
  };
}
