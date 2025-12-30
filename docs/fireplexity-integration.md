# Tier 2 Smart Fireplexity Integration

## Overview

Fireplexity combines **Perplexity AI** (search + synthesis) with **Firecrawl** (web scraping) to provide real-time, up-to-date information for the VisaVerse chat assistant.

**Tier 2 Strategy**: Smart routing that prioritizes free static data and only uses live search when necessary.

## Architecture

### 3-Tier Approach

| Tier | Data Source | Coverage | Cost | Use Case |
|------|-------------|----------|------|----------|
| **Tier 1** | Static JSON + Cached DB | 80% | $0 | Default searches |
| **Tier 2** | Smart Fireplexity (50/month) | 95% | ~$75/month | User-triggered or no results |
| **Tier 3** | Full Fireplexity | 99.9% | ~$900/month | ❌ NOT RECOMMENDED |

### How It Works

```
User Query: "Are there housing programs in Berlin?"
     ↓
1. Search Static Data (FREE)
   - migrant_housing_resources.json (104 resources, 41 countries)
   - Cached visa data (7-day cache)
   ↓
2. Results Found?
   ├─ YES → Return static data (0 API calls)
   └─ NO → Suggest Live Search
              ↓
              User Confirms?
              ├─ YES → Execute Fireplexity (1 API call)
              │        - Perplexity search
              │        - Firecrawl 3 URLs
              │        - Return fresh data
              └─ NO → Show cached/no results
```

## Implementation

### 1. Convex Backend (`/convex/fireplexity.ts`)

**Quota Management**:
```typescript
export const checkFireplexityQuota = query({
  // Returns: { available, used, limit, remaining, resetDate, daysUntilReset }
});

export const logFireplexityUsage = mutation({
  // Increments usage counter
  // Auto-resets on new month
});
```

**Fireplexity Search**:
```typescript
export const fireplexitySearch = action({
  args: { query, targetCountry? },
  handler: async (ctx, args) => {
    // 1. Check quota (50/month limit)
    // 2. Call Perplexity API
    // 3. Extract top 3 citation URLs
    // 4. Scrape URLs with Firecrawl
    // 5. Log usage
    // 6. Return synthesized results
  },
});
```

### 2. CopilotKit Integration (`/app/api/copilotkit/route.ts`)

**Two Actions**:

1. **`searchHousingResources`** (Static)
   - Searches local JSON file
   - If no results → Suggests live search

2. **`searchLiveData`** (Fireplexity)
   - Only triggered when:
     - User explicitly requests "current/latest/live" data
     - Static search returns no results
     - User confirms live search suggestion

**Smart Routing**:
```typescript
// Housing search suggests live search
if (allResources.length === 0 && country) {
  return {
    suggestion: {
      message: `💡 No housing resources found for ${country}. Search live?`,
      action: "searchLiveData",
      actionLabel: "🔍 Search Live Data",
      note: "Uses 1 of 50 monthly live searches",
    },
  };
}
```

## Cost Breakdown

### Tier 2 Budget: ~$75/month

| Service | Cost per Call | Calls/Month | Monthly Cost |
|---------|---------------|-------------|--------------|
| Perplexity API | $0.005 | 50 | $0.25 |
| Firecrawl (3 URLs) | $1.50 | 50 | $75.00 |
| **Total** | | | **~$75.25** |

**Assumptions**:
- 50 Fireplexity searches/month (user-triggered)
- Average 3 URLs scraped per search
- Firecrawl at $0.50/scrape

### Why Not Tier 3?

Full Fireplexity (every chat query) would cost:
- 500 queries/month × $1.50 = **$750/month**
- 1,000 queries/month = **$1,500/month**
- **Not sustainable for hackathon/MVP**

## Setup Instructions

### 1. Get API Keys

**Perplexity AI**:
```bash
# Sign up: https://www.perplexity.ai/settings/api
# Free tier: 1,000 requests/month
# Copy API key
```

**Firecrawl**:
```bash
# Sign up: https://www.firecrawl.dev/
# Free tier: 500 scrapes/month
# Copy API key
```

### 2. Add Environment Variables

```bash
# .env.local
PERPLEXITY_API_KEY=your_perplexity_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### 3. Deploy Convex Functions

```bash
npx convex deploy
```

### 4. Test Integration

**Test quota check**:
```typescript
// In Convex dashboard or local dev
const quota = await ctx.runQuery(api.fireplexity.checkFireplexityQuota);
console.log(quota); // { available: true, used: 0, limit: 50, ... }
```

**Test Fireplexity search**:
```typescript
const results = await ctx.runAction(api.fireplexity.fireplexitySearch, {
  query: "housing programs in Berlin 2025",
  targetCountry: "Germany",
});
console.log(results);
```

## Usage Guidelines

### When AI Should Use `searchLiveData`:

✅ **DO use** when:
- User says "latest", "current", "up-to-date", "2025"
- Static search returns no results and user confirms
- Verifying policy changes or recent news

❌ **DON'T use** when:
- Static data exists
- User doesn't explicitly request live data
- General questions (use static data first)

### Smart UX Pattern

```
User: "Are there housing programs in Berlin?"

AI: "I found 3 resources in my database:
1. Berlin Housing Solutions (Government-Supported NGO)
2. Refugees Welcome Berlin (NGO)
3. Berlin Welcomes You (Online Platform)

💡 Want me to search for the latest programs?
[🔍 Search Live Data] (Uses 1 of 50 monthly searches)"

User clicks → Fireplexity runs → Returns fresh data
```

## Quota Management

### Monthly Reset

- Quota resets automatically on the 1st of each month
- `apiQuota` table tracks usage
- `resetDate` field stores next reset time

### Quota Exceeded Response

```json
{
  "error": true,
  "message": "⚠️ Live search quota exceeded this month (50/50 used). Quota resets in 5 days.",
  "quotaStatus": {
    "available": false,
    "used": 50,
    "limit": 50,
    "remaining": 0,
    "resetDate": 1735689600000,
    "daysUntilReset": 5
  }
}
```

## Monitoring

### Check Usage

```sql
-- In Convex dashboard
SELECT * FROM apiQuota WHERE service = "fireplexity"
```

**Fields**:
- `callCount`: Current month usage
- `lastCallAt`: Last search timestamp
- `resetDate`: When quota resets

### Analytics Queries

```typescript
// Get usage stats
const quota = await ctx.db
  .query("apiQuota")
  .withIndex("by_service", (q) => q.eq("service", "fireplexity"))
  .first();

console.log(`Used: ${quota.callCount}/50`);
console.log(`Resets: ${new Date(quota.resetDate)}`);
```

## Future Enhancements

### Phase 1 (Current)
- ✅ Quota management (50/month)
- ✅ Smart routing (static first)
- ✅ User-triggered live search

### Phase 2 (Post-Hackathon)
- [ ] Per-user quota tracking
- [ ] Premium tier (unlimited searches)
- [ ] Result caching (save Fireplexity results)
- [ ] Usage analytics dashboard
- [ ] Auto-refresh stale data (weekly)

### Phase 3 (Scale)
- [ ] Tiered pricing ($0 free, $10 basic, $50 pro)
- [ ] API rate limiting per user
- [ ] Custom quota allocation
- [ ] Advanced analytics

## Troubleshooting

### Error: "Perplexity API error: 401"
- Check `PERPLEXITY_API_KEY` in environment variables
- Verify API key is active at https://www.perplexity.ai/settings/api

### Error: "Firecrawl API error: 403"
- Check `FIRECRAWL_API_KEY` in environment variables
- Verify monthly scrape quota not exceeded

### Error: "ConvexHttpClient is not defined"
- Ensure `convex/browser` is installed: `npm install convex`
- Check `NEXT_PUBLIC_CONVEX_URL` is set correctly

### Quota Not Resetting
- Check `resetDate` field in `apiQuota` table
- Manually reset: `await ctx.db.patch(quotaId, { callCount: 0, resetDate: nextMonth })`

## Performance

### Latency

| Operation | Time |
|-----------|------|
| Static search | ~50ms |
| Perplexity API | 2-5s |
| Firecrawl (3 URLs) | 5-10s |
| **Total Fireplexity** | **8-15s** |

**Optimization**:
- Show loading indicator during search
- Stream results as they arrive
- Cache frequently requested data

### Cost Optimization

**Best Practices**:
1. Always try static data first
2. Cache Fireplexity results for 24 hours
3. Batch related queries
4. Suggest alternatives before live search
5. Monitor quota daily

## Security

### API Key Protection
- Store keys in environment variables (never commit)
- Use server-side actions only (not exposed to client)
- Rotate keys quarterly

### Rate Limiting
- Implement per-user rate limits (coming in Phase 2)
- Monitor for abuse patterns
- Auto-throttle suspicious usage

## License & Credits

- **Perplexity AI**: https://www.perplexity.ai/
- **Firecrawl**: https://www.firecrawl.dev/
- **Fireplexity Pattern**: Inspired by https://github.com/firecrawl/fireplexity

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Status**: ✅ Production Ready for Hackathon
