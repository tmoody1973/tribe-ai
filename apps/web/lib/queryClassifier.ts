/**
 * Query classifier for determining if real-time information is needed
 * Used to decide when to trigger Perplexity fallback
 */

export interface ClassificationResult {
  isRealtime: boolean;
  isPolicyRelated: boolean;
  confidence: number;
  reason: string;
}

// Real-time query patterns - questions about current/recent information
const REALTIME_PATTERNS = [
  /current(ly)?|right now|today|this (week|month|year)/i,
  /latest|newest|most recent|updated?/i,
  /processing time|wait time|how long (does|will|is)/i,
  /open|closed|available|accepting/i,
  /price|cost|fee.*\d{4}/i, // Prices with year
  /policy change|new (rule|law|regulation)/i,
  /embassy.*appointment/i,
  /visa.*slot/i,
  /\b202[4-9]\b/, // Years 2024-2029
  /schedule|booking|availability/i,
];

// Policy-related patterns - questions about rules and regulations
const POLICY_PATTERNS = [
  /visa (requirement|rule|policy|regulation)/i,
  /immigration (law|policy|change)/i,
  /permit (requirement|application)/i,
  /legal requirement/i,
  /government (announcement|update)/i,
  /official (requirement|document)/i,
  /biometric|medical exam|interview/i,
  /eligibility|qualify|criteria/i,
];

/**
 * Classify a query to determine if real-time/policy information is needed
 */
export function classifyQuery(query: string): ClassificationResult {
  const isRealtime = REALTIME_PATTERNS.some((pattern) => pattern.test(query));
  const isPolicyRelated = POLICY_PATTERNS.some((pattern) => pattern.test(query));

  let confidence = 0;
  const reasons: string[] = [];

  if (isRealtime) {
    confidence += 0.5;
    reasons.push("contains real-time indicators");
  }

  if (isPolicyRelated) {
    confidence += 0.3;
    reasons.push("is policy-related");
  }

  // Check for question words that suggest current information needed
  if (/\b(what is|how much|when can|where to|how do i)\b/i.test(query)) {
    confidence += 0.2;
    reasons.push("asks about current state");
  }

  return {
    isRealtime,
    isPolicyRelated,
    confidence: Math.min(confidence, 1),
    reason: reasons.length > 0 ? `Query ${reasons.join(", ")}` : "Standard knowledge query",
  };
}

/**
 * Determine if Perplexity should be used based on classification and RAG confidence
 */
export function shouldUsePerplexity(
  classification: ClassificationResult,
  ragConfidence: number,
  ragResultCount: number
): boolean {
  // Use Perplexity if:
  // 1. Query is classified as real-time/policy with high confidence
  // 2. OR RAG confidence is low (< 0.4)
  // 3. OR RAG returned very few results (< 2)
  return (
    (classification.isRealtime && classification.confidence > 0.5) ||
    (classification.isPolicyRelated && classification.confidence > 0.5) ||
    ragConfidence < 0.4 ||
    ragResultCount < 2
  );
}
