import migrationData from "@/docs/migration_app_complete.json";

interface Subreddit {
  name: string;
  url: string;
  type: string;
  language: string;
  notes: string;
}

interface Country {
  country: string;
  isoCode: string;
  subreddits: Subreddit[];
}

interface Region {
  name: string;
  countries: Country[];
}

interface MigrationData {
  version: string;
  lastUpdated: string;
  description: string;
  regions: Region[];
}

/**
 * Get subreddits for a specific country by ISO code or country name
 */
export function getSubredditsForCountry(countryIdentifier: string): Subreddit[] {
  const data = migrationData as MigrationData;
  const upperIdentifier = countryIdentifier.toUpperCase();

  for (const region of data.regions) {
    for (const country of region.countries) {
      // Match by ISO code or country name
      if (
        country.isoCode === upperIdentifier ||
        country.country.toUpperCase() === upperIdentifier
      ) {
        return country.subreddits;
      }
    }
  }

  return [];
}

/**
 * Get subreddits for a migration corridor (origin → destination)
 * Returns subreddits from both countries, prioritizing destination
 */
export function getSubredditsForCorridor(
  origin: string,
  destination: string
): Subreddit[] {
  const originSubs = getSubredditsForCountry(origin);
  const destSubs = getSubredditsForCountry(destination);

  // Prioritize destination subreddits, then add origin ones
  return [...destSubs, ...originSubs];
}

/**
 * Get just the subreddit names for scraping
 */
export function getSubredditNames(
  origin: string,
  destination: string
): string[] {
  const subreddits = getSubredditsForCorridor(origin, destination);
  return subreddits.map((sub) => sub.name);
}
