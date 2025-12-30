/**
 * Currency utilities for auto-detection and conversion
 */

export type SupportedCurrency = "USD" | "CAD" | "GBP" | "EUR" | "AUD";

/**
 * Map of countries to their default currencies
 * Used for auto-selecting destination currency in budget wizard
 */
const countryCurrencyMap: Record<string, SupportedCurrency> = {
  // North America
  "Canada": "CAD",
  "United States": "USD",
  "USA": "USD",
  "United States of America": "USD",
  "Mexico": "USD", // Most migration budgets in USD

  // Europe
  "United Kingdom": "GBP",
  "UK": "GBP",
  "England": "GBP",
  "Scotland": "GBP",
  "Wales": "GBP",
  "Northern Ireland": "GBP",

  // Eurozone countries
  "Germany": "EUR",
  "France": "EUR",
  "Spain": "EUR",
  "Italy": "EUR",
  "Netherlands": "EUR",
  "Belgium": "EUR",
  "Austria": "EUR",
  "Portugal": "EUR",
  "Ireland": "EUR",
  "Greece": "EUR",
  "Finland": "EUR",
  "Poland": "EUR",
  "Sweden": "EUR",
  "Denmark": "EUR",
  "Norway": "EUR",
  "Switzerland": "EUR",

  // Oceania
  "Australia": "AUD",
  "New Zealand": "AUD", // Often budgeted in AUD for region

  // Africa (default to USD for migration budgets)
  "Nigeria": "USD",
  "Kenya": "USD",
  "South Africa": "USD",
  "Ghana": "USD",
  "Ethiopia": "USD",

  // Asia (default to USD for migration budgets)
  "India": "USD",
  "Philippines": "USD",
  "Pakistan": "USD",
  "Bangladesh": "USD",
  "China": "USD",
  "Vietnam": "USD",
  "Thailand": "USD",

  // Middle East
  "United Arab Emirates": "USD",
  "UAE": "USD",
  "Saudi Arabia": "USD",
  "Qatar": "USD",
};

/**
 * Get the default currency for a given country
 * @param country - Country name (e.g., "Canada", "United States")
 * @returns Currency code (e.g., "CAD", "USD")
 */
export function getDefaultCurrency(country: string): SupportedCurrency {
  // Try exact match first
  if (countryCurrencyMap[country]) {
    return countryCurrencyMap[country];
  }

  // Try case-insensitive match
  const normalizedCountry = Object.keys(countryCurrencyMap).find(
    (key) => key.toLowerCase() === country.toLowerCase()
  );

  if (normalizedCountry) {
    return countryCurrencyMap[normalizedCountry];
  }

  // Default to USD if country not found
  return "USD";
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  const symbols: Record<SupportedCurrency, string> = {
    USD: "$",
    CAD: "C$",
    GBP: "£",
    EUR: "€",
    AUD: "A$",
  };
  return symbols[currency];
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency
): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get all supported currencies as options for dropdown
 */
export function getCurrencyOptions(): Array<{
  value: SupportedCurrency;
  label: string;
}> {
  return [
    { value: "USD", label: "USD - US Dollar" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "AUD", label: "AUD - Australian Dollar" },
  ];
}
