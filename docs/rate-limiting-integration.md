# Rate Limiting Integration Guide

## Overview

Rate limiting is implemented to prevent cost overruns during the hackathon. Each user has daily limits on expensive API operations.

## Daily Limits

| Action | Limit/Day | Cost per Action | Max Daily Cost |
|--------|-----------|-----------------|----------------|
| Chat Messages | 50 | $0.0001 | $0.005 |
| Fireplexity Searches | 5 | $1.50 | $7.50 |
| Visa Discovery | 10 | Free | $0 |
| Processing Times | 5 | $0.005 | $0.025 |
| Static Searches | ∞ | $0 | $0 |

**Total Max Cost per User per Day: ~$7.53**

## Implementation Status

✅ **Implemented:**
- Rate limit schema table
- Rate limit queries and mutations
- Rate limit middleware helpers

⏳ **TODO (when authentication is ready):**
- Integrate user ID from Clerk auth
- Add rate limit checks to CopilotKit action handlers
- Display rate limit status in UI

## Integration Steps

### 1. Get User ID in CopilotKit Route

Update `/app/api/copilotkit/route.ts`:

```typescript
import { auth } from "@clerk/nextjs";
import { checkActionRateLimit, incrementActionRateLimit } from "@/lib/rateLimitMiddleware";

export const POST = async (req: Request) => {
  // Get authenticated user
  const { userId: clerkId } = auth();

  if (!clerkId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get Convex user ID from Clerk ID
  const convexUser = await convex.query(api.users.getByClerkId, { clerkId });

  if (!convexUser) {
    return new Response("User not found", { status: 404 });
  }

  // Continue with CopilotKit runtime...
};
```

### 2. Add Rate Limiting to Action Handlers

Update expensive action handlers:

```typescript
{
  name: "searchLiveData",
  description: "...",
  handler: async ({ query, targetCountry }: any) => {
    // CHECK RATE LIMIT
    const rateLimit = await checkActionRateLimit(
      convex,
      convexUser._id,
      "fireplexity_search"
    );

    if (!rateLimit.allowed) {
      return {
        error: true,
        message: formatRateLimitError("fireplexity_search", rateLimit),
        rateLimitExceeded: true,
      };
    }

    try {
      // Execute action...
      const results = await convex.action(api.fireplexity.fireplexitySearch, {
        query,
        targetCountry,
      });

      // INCREMENT RATE LIMIT
      await incrementActionRateLimit(convex, convexUser._id, "fireplexity_search");

      return results;
    } catch (error) {
      return { error: true, message: String(error) };
    }
  },
}
```

### 3. Add Rate Limiting to Other Actions

Apply the same pattern to:

- ✅ `searchVisaOptions` → `"visa_discovery"`
- ✅ `searchLiveData` → `"fireplexity_search"`
- ⏳ Chat message handler → `"chat_message"` (when using streaming)

### 4. Display Rate Limit Status in UI

Create a component to show rate limit status:

```typescript
// components/RateLimitStatus.tsx
export function RateLimitStatus() {
  const convex = useConvex();
  const user = useUser(); // Clerk

  const rateLimitStatus = useQuery(
    api.rateLimit.getUserRateLimitStatus,
    { userId: convexUserId }
  );

  if (!rateLimitStatus) return null;

  return (
    <div className="border-4 border-black bg-yellow-50 p-4">
      <h3 className="font-black mb-2">📊 Today's Usage</h3>
      <div className="space-y-2 text-sm">
        <div>
          Fireplexity: {rateLimitStatus.status.fireplexity_search.used}/
          {rateLimitStatus.status.fireplexity_search.limit}
        </div>
        <div>
          Visa Queries: {rateLimitStatus.status.visa_discovery.used}/
          {rateLimitStatus.status.visa_discovery.limit}
        </div>
        <div className="font-bold">
          Estimated Cost: ${rateLimitStatus.totalEstimatedCostDollars}
        </div>
      </div>
    </div>
  );
}
```

## Admin Controls

### Reset User Rate Limits

From Convex dashboard:

```javascript
// Reset all limits for a user
await ctx.runMutation(api.rateLimit.resetUserRateLimits, {
  userId: "user_id_here"
});

// Reset specific action
await ctx.runMutation(api.rateLimit.resetUserRateLimits, {
  userId: "user_id_here",
  action: "fireplexity_search"
});
```

### Monitor Global Usage

```javascript
// Get all rate limits for today
const limits = await ctx.db
  .query("rateLimits")
  .withIndex("by_date", (q) => q.eq("date", todayStart))
  .collect();

// Calculate total estimated cost
const totalCost = limits.reduce((sum, limit) => {
  const config = RATE_LIMITS[limit.action];
  return sum + (limit.count * config.costPerAction);
}, 0);

console.log(`Total estimated cost today: $${(totalCost / 100).toFixed(2)}`);
```

## Graceful Degradation

When rate limits are hit, actions with `gracefulFallback: true` will:

1. Return cached data instead of making API calls
2. Show a message about rate limits
3. Indicate when limits reset

Example response:

```json
{
  "success": true,
  "cached": true,
  "expired": false,
  "rateLimitExceeded": true,
  "message": "⚠️ Daily limit exceeded (5/5 used). Showing cached data. Limit resets in 8 hours at 00:00 UTC.",
  "data": { ... }
}
```

## Cost Projections

### Single User (Heavy Usage)
- 50 chat messages/day: $0.005
- 5 Fireplexity searches/day: $7.50
- 10 visa queries/day: $0 (free tier)
- 5 processing time lookups/day: $0.025
- **Total: ~$7.53/day**

### 100 Users (Average Usage)
Assuming 50% of users hit 50% of limits:
- 50 users × $3.77/day = **$188.50/day**
- **Monthly: ~$5,655**

### Hackathon (3 Days, 20 Demo Users)
- 20 users × $7.53 × 3 days = **$451.80 total**
- With 50% average usage: **$225.90 total**

## Safety Mechanisms

1. **Daily resets** - Limits reset at UTC midnight
2. **Per-user tracking** - No single user can cause runaway costs
3. **Global quotas** - Fireplexity (50/month), Travel Buddy (120/month)
4. **Graceful fallback** - Show cached data when limits hit
5. **Admin override** - Can reset limits if needed

## Testing

```bash
# Test rate limit check
curl -X POST http://localhost:3000/api/copilotkit \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{"action": "searchLiveData", "query": "test"}'

# Should return rate limit error after 5 searches
```

## Monitoring During Hackathon

Create a dashboard showing:
- Real-time usage per action type
- Total estimated cost (current + projected)
- Users hitting limits
- Top consumers

```sql
-- In Convex dashboard
SELECT
  action,
  COUNT(*) as users,
  SUM(count) as total_actions,
  SUM(count * cost_per_action) as estimated_cost
FROM rateLimits
WHERE date = <today>
GROUP BY action;
```

---

**Status**: Rate limiting infrastructure complete ✅
**Next**: Integrate with Clerk authentication and add UI components
