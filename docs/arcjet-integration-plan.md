# Arcjet Integration Plan - VisaVerse Hackathon

## Overview

Arcjet provides **edge-level protection** that complements our existing Convex rate limiting. While Convex rate limiting tracks per-user daily quotas and API costs, Arcjet adds:

1. **Bot Protection** - Block malicious bots and scrapers
2. **Request-Level Rate Limiting** - Prevent abuse before hitting our APIs
3. **AI Token Quota Control** - Track and limit AI token consumption
4. **Shield Protection** - Detect suspicious patterns and attacks

## Architecture: Two-Layer Defense

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: Arcjet (Edge Protection)                       │
│  - Bot detection and blocking                            │
│  - Request-level rate limiting (per IP/session)          │
│  - Shield (attack detection)                             │
│  - AI token estimation and limiting                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                        ALLOWED?
                            │
                  ┌─────────┴─────────┐
                  │                   │
                 NO                  YES
                  │                   │
                  ▼                   ▼
             403 Forbidden   ┌────────────────────────────┐
                             │  LAYER 2: Convex Rate      │
                             │  - Per-user daily quotas   │
                             │  - API call tracking       │
                             │  - Cost monitoring         │
                             │  - Graceful degradation    │
                             └────────────────────────────┘
                                       │
                                       ▼
                                 Process Request
```

**Why Two Layers?**

- **Arcjet (Edge)**: Fast, global protection at the network boundary. Blocks bad actors before they consume resources.
- **Convex (Application)**: Tracks authenticated user behavior, enforces business limits, manages API quotas.

## Hackathon Strategy

For a **3-day hackathon demo**, we'll implement:

1. ✅ **Bot Protection** - Essential (prevents abuse during demo)
2. ✅ **Request Rate Limiting** - Essential (protects against spam)
3. ⚠️ **AI Token Quota** - Nice-to-have (requires token estimation)
4. ⚠️ **Shield** - Optional (basic attack detection)

## Installation

```bash
npm install @arcjet/next
```

**Environment Variable** (already added):
```env
ARCJET_KEY=your_key_here
```

## Implementation

### 1. Basic Arcjet Setup

Create `/lib/arcjet.ts`:

```typescript
import arcjet, { shield, tokenBucket, detectBot } from "@arcjet/next";

// Arcjet instance with hackathon-appropriate rules
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Shield: Basic attack detection
    shield({
      mode: "LIVE",
    }),

    // Bot Protection: Block known bad bots, allow good bots
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc.
        "CATEGORY:PREVIEW", // Social media preview bots
      ],
    }),

    // Request-level rate limit: 100 requests per 15 minutes per IP
    tokenBucket({
      mode: "LIVE",
      characteristics: ["ip"],
      refillRate: 100,
      interval: "15m",
      capacity: 150,
    }),
  ],
});
```

### 2. Integrate with CopilotKit Route

Update `/app/api/copilotkit/route.ts`:

```typescript
import { aj } from "@/lib/arcjet";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // ===== ARCJET PROTECTION (Layer 1: Edge) =====
  const decision = await aj.protect(req);

  // Log decision for monitoring
  console.log("Arcjet Decision:", {
    id: decision.id,
    conclusion: decision.conclusion,
    ip: decision.ip,
  });

  // Block if denied
  if (decision.isDenied()) {
    // Check specific reasons
    if (decision.reason.isBot()) {
      console.warn("Blocked bot:", decision.ip);
      return NextResponse.json(
        {
          error: "Automated requests are not allowed",
          reason: "bot_detected",
        },
        { status: 403 }
      );
    }

    if (decision.reason.isRateLimit()) {
      console.warn("Rate limit exceeded:", decision.ip);
      return NextResponse.json(
        {
          error: "Too many requests. Please try again in a few minutes.",
          reason: "rate_limit",
          resetAt: decision.reason.resetTime,
        },
        { status: 429 }
      );
    }

    if (decision.reason.isShield()) {
      console.warn("Shield block:", decision.ip);
      return NextResponse.json(
        {
          error: "Request blocked by security policy",
          reason: "shield",
        },
        { status: 403 }
      );
    }

    // Generic denial
    return NextResponse.json(
      { error: "Request denied" },
      { status: 403 }
    );
  }

  // Log warnings for errors (fails open)
  if (decision.isErrored()) {
    console.warn("Arcjet error (allowing request):", decision.reason.message);
  }

  // ===== AUTHENTICATION (when implemented) =====
  // const { userId: clerkId } = auth();
  // if (!clerkId) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  // ===== CONVEX RATE LIMITING (Layer 2: Application) =====
  // This will be integrated when Clerk auth is ready
  // See: /docs/rate-limiting-integration.md

  // ===== COPILOTKIT RUNTIME =====
  // Continue with existing CopilotKit setup...

  const runtime = new CopilotRuntime({
    // ... existing configuration
  });

  return runtime.streamHttpServerResponse(req, res, copilotKit);
}
```

### 3. AI Token Quota Control (Optional)

For **advanced cost control**, add token-based limiting for AI actions:

```typescript
// lib/arcjet.ts - Add token bucket for AI operations
import { tokenBucket } from "@arcjet/next";

export const aiQuotaArcjet = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"], // Track per user
  rules: [
    // 100,000 tokens per day per user
    tokenBucket({
      mode: "LIVE",
      characteristics: ["userId"],
      refillRate: 100000,
      interval: "24h",
      capacity: 100000,
    }),
  ],
});

// Token estimation helper
export function estimateTokens(prompt: string): number {
  // Simple estimation: ~4 characters = 1 token
  return Math.ceil(prompt.length / 4);
}
```

Usage in CopilotKit action handler:

```typescript
// In searchLiveData handler
const estimatedTokens = estimateTokens(query);

const aiDecision = await aiQuotaArcjet.protect(req, {
  requested: estimatedTokens,
  userId: convexUser._id,
});

if (aiDecision.isDenied()) {
  return {
    error: true,
    message: "AI quota exceeded for today. Try again tomorrow.",
    quotaExceeded: true,
  };
}
```

### 4. Monitoring Dashboard

Arcjet provides a dashboard at **app.arcjet.com** showing:

- Real-time request decisions
- Bot detection activity
- Rate limit hits
- Top blocked IPs
- Attack patterns

**For Hackathon Demo**:
- Monitor dashboard during judging to show security features
- Highlight blocked bot attempts and rate limiting in action

## Configuration Matrix

### Hackathon Mode (Recommended)

| Feature | Mode | Configuration | Reason |
|---------|------|---------------|--------|
| Shield | LIVE | Default rules | Basic attack protection |
| Bot Detection | LIVE | Allow search/preview bots | Block bad bots, allow legitimate |
| Request Rate Limit | LIVE | 100 req/15min per IP | Prevent spam/abuse |
| AI Token Quota | DRY_RUN | Log only | Complex to test, log for analysis |

### Production Mode (Post-Hackathon)

| Feature | Mode | Configuration | Reason |
|---------|------|---------------|--------|
| Shield | LIVE | Custom rules | Enhanced attack detection |
| Bot Detection | LIVE | Stricter allow list | Tighter bot control |
| Request Rate Limit | LIVE | 50 req/15min per IP | Lower limits for production |
| AI Token Quota | LIVE | 50k tokens/day/user | Active cost control |

## Cost Estimates

### Arcjet Free Tier
- **5,000 requests/month** included
- Additional requests: $0.50 per 1,000 requests

### Hackathon Usage (20 users, 3 days)
- Estimated requests:
  - 20 users × 50 chat messages/day × 3 days = 3,000 requests
  - Bot attempts: ~500 requests (blocked)
  - **Total: ~3,500 requests** (well within free tier)

### Cost: **$0** (free tier sufficient)

## Testing

### Test Bot Protection

```bash
# Request with known bot user agent
curl -X POST https://your-app.vercel.app/api/copilotkit \
  -H "User-Agent: python-requests/2.31.0" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Expected: 403 Forbidden (bot detected)
```

### Test Rate Limiting

```bash
# Send 101 requests rapidly from same IP
for i in {1..101}; do
  curl -X POST https://your-app.vercel.app/api/copilotkit \
    -H "Content-Type: application/json" \
    -d '{"message": "test '$i'"}'
done

# Expected: First 100 succeed, 101st returns 429 Too Many Requests
```

### Test Shield Protection

```bash
# Send suspicious request pattern
curl -X POST https://your-app.vercel.app/api/copilotkit \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.0.2.1" \
  -d '{"message": "<script>alert(1)</script>"}'

# Expected: May be blocked by shield (depends on pattern)
```

## Implementation Checklist

### Phase 1: Core Protection (Day 1)
- [x] Install Arcjet SDK
- [x] Add ARCJET_KEY to environment variables
- [ ] Create `/lib/arcjet.ts` with basic configuration
- [ ] Integrate Arcjet protection into `/app/api/copilotkit/route.ts`
- [ ] Test bot protection with curl
- [ ] Test rate limiting with rapid requests
- [ ] Verify Arcjet dashboard shows decisions

### Phase 2: Enhanced Protection (Day 2)
- [ ] Add AI token quota control (optional)
- [ ] Configure custom bot allow/deny lists
- [ ] Add error logging for Arcjet decisions
- [ ] Test graceful degradation (fail-open mode)

### Phase 3: Demo Preparation (Day 3)
- [ ] Create demo script showing bot blocks
- [ ] Prepare Arcjet dashboard screenshots for presentation
- [ ] Document security features in README
- [ ] Test all protection features before judging

## Integration with Existing Rate Limiting

### How They Work Together

```typescript
// Example: searchLiveData handler

export async function POST(req: NextRequest) {
  // LAYER 1: Arcjet (blocks bad actors at edge)
  const arcjetDecision = await aj.protect(req);
  if (arcjetDecision.isDenied()) {
    return NextResponse.json({ error: "Blocked" }, { status: 403 });
  }

  // LAYER 2: Get authenticated user
  const { userId: clerkId } = auth();
  const convexUser = await convex.query(api.users.getByClerkId, { clerkId });

  // LAYER 3: Convex rate limiting (per-user quotas)
  const rateLimit = await checkActionRateLimit(
    convex,
    convexUser._id,
    "fireplexity_search"
  );

  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: "Daily limit exceeded",
      rateLimitExceeded: true,
    }, { status: 429 });
  }

  // Execute action...
  const result = await convex.action(api.fireplexity.fireplexitySearch, {
    query,
    targetCountry,
  });

  // Increment Convex rate limit
  await incrementActionRateLimit(convex, convexUser._id, "fireplexity_search");

  return NextResponse.json(result);
}
```

### Why Both?

| Layer | Purpose | Scope | Tracking |
|-------|---------|-------|----------|
| **Arcjet** | Prevent abuse | Per IP/session | Request-level |
| **Convex** | Manage costs | Per authenticated user | Daily quotas |

**Example Scenario**:
1. Malicious bot tries 1000 requests → **Arcjet blocks after 100** (request limit)
2. Legitimate user makes 6 Fireplexity searches → **Convex blocks 6th** (daily quota: 5)
3. Attacker tries SQL injection → **Arcjet Shield blocks** (attack pattern)
4. User hits Convex limit → **Returns cached data** (graceful degradation)

## Security Best Practices for Hackathon

### 1. Fail-Open Strategy
- Default: Allow requests if Arcjet has errors (service downtime won't break demo)
- For sensitive actions, fail-closed: `if (decision.isErrored()) return 403;`

### 2. Logging
```typescript
// Log all Arcjet decisions for analysis
console.log("Arcjet:", {
  id: decision.id,
  conclusion: decision.conclusion,
  ip: decision.ip,
  reason: decision.reason,
});
```

### 3. User-Friendly Error Messages
```typescript
// Don't expose security details to users
if (decision.isDenied()) {
  // Internal logging
  console.warn("Arcjet blocked:", decision.reason);

  // User-facing message
  return NextResponse.json(
    { error: "Unable to process request. Please try again later." },
    { status: 403 }
  );
}
```

### 4. Demo Showcase
Create a `/api/arcjet-test` endpoint to demonstrate protection:

```typescript
// app/api/arcjet-test/route.ts
import { aj } from "@/lib/arcjet";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const decision = await aj.protect(req);

  return NextResponse.json({
    allowed: decision.isAllowed(),
    conclusion: decision.conclusion,
    ip: decision.ip,
    reasons: decision.results.map(r => r.reason),
  });
}
```

## Advantages for Hackathon Judging

### Innovation Score
- **Modern Security Stack**: Show awareness of edge-level security
- **Defense in Depth**: Two-layer protection demonstrates architecture thinking

### Technical Execution Score
- **Production-Ready**: Arcjet is enterprise-grade, not just a demo hack
- **Scalability**: Global edge protection without infrastructure management

### AI Use Score
- **AI Token Control**: Show cost management for AI operations
- **Smart Bot Detection**: ML-powered bot classification

### Impact Score
- **Cost Protection**: Prevent runaway AI costs during demo
- **Abuse Prevention**: Protect against malicious users

## Troubleshooting

### Issue: Arcjet blocking legitimate requests

**Solution**: Check bot detection allow list
```typescript
detectBot({
  mode: "LIVE",
  allow: [
    "CATEGORY:SEARCH_ENGINE",
    "CATEGORY:PREVIEW",
    "CATEGORY:MONITOR", // Add monitoring services
  ],
})
```

### Issue: Rate limit too strict for demo

**Solution**: Increase capacity during hackathon
```typescript
tokenBucket({
  mode: "LIVE",
  refillRate: 200, // Increased from 100
  interval: "15m",
  capacity: 250, // Increased from 150
})
```

### Issue: Arcjet API errors

**Solution**: Verify environment variable
```bash
echo $ARCJET_KEY
# Should output: ajkey_...
```

Check dashboard at app.arcjet.com for API key status.

## Next Steps

1. **Create `/lib/arcjet.ts`** - Basic configuration
2. **Update `/app/api/copilotkit/route.ts`** - Add Arcjet protection
3. **Test protection features** - Bot blocking, rate limiting
4. **Monitor Arcjet dashboard** - Verify decisions are logged
5. **Prepare demo script** - Show security features during judging

---

**Status**: Ready for implementation ✅
**Estimated Time**: 2-3 hours (basic setup + testing)
**Dependencies**: ARCJET_KEY environment variable (already added)
**Risk**: Low (fails open by default, won't break demo)

## References

- [Arcjet Next.js Docs](https://docs.arcjet.com/reference/nextjs)
- [AI Quota Control Blueprint](https://docs.arcjet.com/blueprints/ai-quota-control)
- [Bot Protection Guide](https://docs.arcjet.com/bot-protection/quick-start)
- [Rate Limiting Guide](https://docs.arcjet.com/rate-limiting/quick-start)
- [Arcjet Dashboard](https://app.arcjet.com)
