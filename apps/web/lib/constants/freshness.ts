// Freshness thresholds for protocol caching

export const FRESHNESS_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const CONTENT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Check if a corridor's research is still fresh
 */
export function isFresh(lastResearchedAt: number | undefined): boolean {
  if (!lastResearchedAt) return false;
  return Date.now() - lastResearchedAt < FRESHNESS_THRESHOLD_MS;
}

/**
 * Check if a corridor's research is stale and needs refresh
 */
export function isStale(lastResearchedAt: number | undefined): boolean {
  if (!lastResearchedAt) return true;
  return Date.now() - lastResearchedAt >= FRESHNESS_THRESHOLD_MS;
}

/**
 * Get the age of research in human-readable format
 */
export function getResearchAge(lastResearchedAt: number | undefined): string {
  if (!lastResearchedAt) return "never";

  const ageMs = Date.now() - lastResearchedAt;
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
