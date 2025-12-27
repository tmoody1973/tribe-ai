# Live Corridor Feed - Complete Redesign Plan

## Current Problems
- ❌ Shows irrelevant content (France/Switzerland for US → JP)
- ❌ No visual hierarchy or engagement metrics
- ❌ No snippets or preview text
- ❌ Not personalized to user's journey stage
- ❌ Missing multi-media content (YouTube, etc.)
- ❌ No real-time alerts or policy updates

## Vision: Feed as a Migrant's Command Center

**Goal**: Create the first place a migrant checks every day for:
- Breaking news that affects their journey
- Real experiences from people like them
- Actionable advice at their exact stage
- Community connections and support

---

## 📋 Content Categories & Priority

### 1. **🚨 Alerts & Breaking News** (Top Priority)
**What:**
- Policy changes in last 24h
- Visa slots opened
- Fee changes
- Processing time updates
- Scam warnings

**Sources:**
- Perplexity API (government sources)
- Tavily (news aggregation)
- Reddit (community alerts)

**Visual:**
```
┌─────────────────────────────────────────┐
│ 🚨 ALERT: Visa Update                   │
│ ⏰ 2 hours ago · Official               │
├─────────────────────────────────────────┤
│ Japan opens 500 new skilled worker      │
│ visa slots for tech professionals       │
│                                         │
│ 📍 Source: mofa.go.jp                   │
│ 💬 47 discussing this                   │
└─────────────────────────────────────────┘
```

### 2. **📊 Success Stories & Timelines** (High Value)
**What:**
- Recent approvals with full timeline
- Cost breakdowns
- Document lists that worked
- Interview experiences

**Sources:**
- Reddit (r/IWantOut, r/japan filtered)
- Tavily (blog posts)
- Forums (Tokyo Dev, Japan Guide)

**Visual:**
```
┌─────────────────────────────────────────┐
│ ✅ Success Story                        │
│ 👤 u/techworker123 · 5h ago · Reddit   │
├─────────────────────────────────────────┤
│ [US → JP] Just got my Highly Skilled   │
│ Professional visa approved!              │
│                                         │
│ Timeline:                               │
│ • Applied: Oct 15                       │
│ • Approved: Dec 20 (66 days)           │
│ • Total cost: $850                      │
│                                         │
│ 👍 234 · 💬 67 comments                │
└─────────────────────────────────────────┘
```

### 3. **🎥 Video Content** (Engagement)
**What:**
- City tours (Tokyo, Osaka)
- Day-in-the-life as expat
- Visa interview walkthroughs
- Cultural guides
- Housing apartment tours

**Sources:**
- YouTube Data API v3
- Search queries:
  - "Moving to Japan 2025"
  - "Tokyo expat life"
  - "Japan visa interview experience"
  - "Living in Japan as American"

**Visual:**
```
┌─────────────────────────────────────────┐
│ 🎥 Video Guide                          │
│ 📺 Tokyo Lens · 1 day ago · YouTube    │
├─────────────────────────────────────────┤
│ [Thumbnail Image]                       │
│                                         │
│ First Month in Tokyo: Cost Breakdown   │
│ & Apartment Hunting Tips                │
│                                         │
│ ⏱ 15:23 · 👁 125K views · 👍 4.2K     │
└─────────────────────────────────────────┘
```

### 4. **💬 Community Discussions** (Social Proof)
**What:**
- Active Reddit threads
- Forum Q&A
- Recent experiences
- Tips and warnings

**Sources:**
- Reddit JSON API
- Forum scraping (Firecrawl)
- Tavily discussion aggregation

**Visual:**
```
┌─────────────────────────────────────────┐
│ 💬 Discussion                           │
│ 👥 r/movingtojapan · 3h ago · Reddit   │
├─────────────────────────────────────────┤
│ Housing deposit shock - they want 6    │
│ months upfront in Tokyo?!               │
│                                         │
│ "Just found out standard rental         │
│ deposits in Tokyo are: First month,    │
│ last month, security deposit, key      │
│ money, and agency fee. Total: ~$7K..."  │
│                                         │
│ 👍 89 · 💬 45 comments                 │
└─────────────────────────────────────────┘
```

### 5. **📚 Educational Content** (Foundation)
**What:**
- Visa type comparisons
- Step-by-step guides
- Document templates
- Cultural primers

**Sources:**
- Government sites (Firecrawl PDF extraction)
- Immigration blogs
- YouTube tutorials
- Community wikis

---

## 🎨 Visual Design System (Threads/Twitter Style)

**Inspiration**: Clean, social media feed like Threads/Twitter with:
- Infinite scroll
- Inline media (videos play in feed)
- Quick actions (save, upvote, share)
- Clean typography, lots of white space
- Minimal but engaging

### Feed Layout

```
┌──────────────────────────────────────────────────────┐
│                   LIVE Corridor Feed                 │
│              🔴 2,233 tracking · 513 moved          │
├──────────────────────────────────────────────────────┤
│  [Filters: All | 🚨 Alerts | 🎥 Videos | 💬 Discuss]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  🚨 ALERT · Official · 2h ago                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ Japan opens 500 new skilled worker visa slots  │ │
│  │ for tech professionals                          │ │
│  │                                                 │ │
│  │ Applications accepted through Jan 31. Priority │ │
│  │ for AI, cybersecurity roles...                  │ │
│  │                                                 │ │
│  │ 📍 mofa.go.jp                                  │ │
│  │ 💬 47 discussing · 🔖 Save · ↗️ Share          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ───────────────────────────────────────────────── │
│                                                      │
│  👤 u/techworker123 · Reddit · 5h ago              │
│  ┌────────────────────────────────────────────────┐ │
│  │ ✅ [US → JP] Just got my HSP visa approved!   │ │
│  │                                                 │ │
│  │ Timeline: Applied Oct 15 → Approved Dec 20     │ │
│  │ (66 days). Total cost: $850                    │ │
│  │                                                 │ │
│  │ Happy to answer questions!                      │ │
│  │                                                 │ │
│  │ 👍 234 · 💬 67 comments · 🔖 Save · ↗️ Share  │ │
│  │                                                 │ │
│  │ [Click to expand thread...]                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ───────────────────────────────────────────────── │
│                                                      │
│  🎥 Tokyo Lens · YouTube · 1 day ago               │
│  ┌────────────────────────────────────────────────┐ │
│  │ [▶ Play Video - Inline]                        │ │
│  │ ┌──────────────────────────────────────────┐   │ │
│  │ │     [Video Thumbnail/Player]             │   │ │
│  │ │                                          │   │ │
│  │ │     First Month in Tokyo: Cost           │   │ │
│  │ │     Breakdown & Tips                     │   │ │
│  │ │                                          │   │ │
│  │ │     ⏱ 15:23                             │   │ │
│  │ └──────────────────────────────────────────┘   │ │
│  │                                                 │ │
│  │ ✨ AI SUMMARY (Click to expand)                │ │
│  │ Covers actual first-month costs ($8,500).      │ │
│  │ Key: apartment deposits, phone setup...        │ │
│  │                                                 │ │
│  │ 👁 125K views · 👍 4.2K · 🔖 Save · ↗️ Share  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [Load More...]                                     │
└──────────────────────────────────────────────────────┘
```

### Card Types

#### **Alert Card** (Red/Orange gradient)
```tsx
<AlertCard
  type="opportunity" // or "warning" or "update"
  title="Visa Slots Opened"
  snippet="Japan immigration just released..."
  source="official"
  timestamp={Date.now()}
  url="https://..."
  engagement={{ discussing: 47 }}
/>
```

#### **Success Story Card** (Green accent)
```tsx
<SuccessCard
  author="u/techworker123"
  platform="reddit"
  title="Just got approved!"
  timeline={[
    { event: "Applied", date: "Oct 15" },
    { event: "Approved", date: "Dec 20" }
  ]}
  cost={850}
  upvotes={234}
  comments={67}
/>
```

#### **Video Card** (Dark bg with thumbnail)
```tsx
<VideoCard
  platform="youtube"
  channel="Tokyo Lens"
  title="First Month in Tokyo: Cost Breakdown"
  thumbnail="https://..."
  duration="15:23"
  views={125000}
  likes={4200}
  publishedAt="1 day ago"
/>
```

#### **Discussion Card** (White bg, blue accent)
```tsx
<DiscussionCard
  platform="reddit"
  subreddit="movingtojapan"
  author="u/confused_american"
  title="Housing deposit shock"
  snippet="Just found out..."
  upvotes={89}
  comments={45}
  timestamp="3h ago"
/>
```

### Badges & Indicators
- 🏛️ **Official** - Government sources
- ✅ **Verified** - Confirmed by community
- 🔥 **Trending** - High engagement in last 24h
- ⏰ **Fresh** - Posted in last 6h
- ⚠️ **Warning** - Scam alert or risk
- 💡 **Opportunity** - Time-sensitive benefit

---

## 🔧 Technical Implementation

### Phase 1: Smart Content Aggregation (Week 1-2)

#### 1.1 Tavily Integration for Personalized Search
```typescript
// apps/web/app/api/corridor-feed/route.ts

async function fetchSmartCorridorContent(
  origin: string,
  destination: string,
  userStage: "researching" | "applying" | "approved" | "arrived"
) {
  // Base query personalized by stage
  const stageQueries = {
    researching: `moving from ${origin} to ${destination} visa requirements costs timeline 2025`,
    applying: `${destination} visa application tips interview experience documents checklist`,
    approved: `${destination} housing jobs first month guide expat life`,
    arrived: `${destination} settling in expat community cultural tips adapting`
  };

  const tavilyResults = await tavily.search({
    query: stageQueries[userStage],
    searchDepth: "advanced",
    maxResults: 10,
    includeDomains: [
      // Official sources
      getOfficialImmigrationSite(destination),
      `${destination.toLowerCase()}.gov`,
      // Community sources
      "reddit.com",
      "expatforum.com",
      // YouTube
      "youtube.com"
    ],
    days: 7, // Recent content only
    includeAnswer: true
  });

  return tavilyResults;
}
```

#### 1.2 Perplexity for Breaking Alerts
```typescript
async function checkPolicyAlerts(destination: string) {
  const alerts = await perplexity.search({
    query: `${destination} immigration visa policy changes updates ${new Date().toISOString().split('T')[0]}`,
    search_recency_filter: "day", // Last 24 hours only
    search_domain_filter: [
      getGovernmentDomain(destination),
      "embassy.gov",
      "immigration"
    ]
  });

  return alerts.results
    .filter(r => containsAlertKeywords(r.snippet))
    .map(r => ({
      source: "official",
      type: "alert",
      alertType: detectAlertType(r.snippet),
      title: r.title,
      snippet: r.snippet,
      url: r.url,
      timestamp: Date.now(),
      isAlert: true
    }));
}
```

#### 1.3 YouTube Integration
```typescript
// apps/web/lib/youtube.ts
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

async function searchCorridorVideos(
  origin: string,
  destination: string,
  type: "guide" | "experience" | "city-tour"
) {
  const searchQueries = {
    guide: `moving to ${destination} visa guide ${new Date().getFullYear()}`,
    experience: `living in ${destination} as ${getNationality(origin)} expat`,
    "city-tour": `${destination} city tour apartment hunting`
  };

  const response = await youtube.search.list({
    part: ['snippet'],
    q: searchQueries[type],
    type: ['video'],
    maxResults: 5,
    order: 'relevance',
    publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
    videoDuration: 'medium', // 4-20 min
    relevanceLanguage: 'en'
  });

  return response.data.items.map(item => ({
    source: "youtube",
    type: "video",
    title: item.snippet.title,
    snippet: item.snippet.description.slice(0, 200),
    thumbnail: item.snippet.thumbnails.high.url,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
    channel: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt
  }));
}
```

### Phase 2: Smart Filtering & Ranking (Week 3)

#### 2.1 Relevance Scoring Algorithm
```typescript
function scoreRelevance(
  item: FeedItem,
  userContext: {
    origin: string;
    destination: string;
    stage: string;
    visaType?: string;
    interests?: string[];
  }
): number {
  let score = 0;

  // Destination match (required)
  const destinationMentioned =
    item.title.toLowerCase().includes(userContext.destination.toLowerCase()) ||
    item.snippet.toLowerCase().includes(userContext.destination.toLowerCase());

  if (!destinationMentioned) return 0; // Filter out

  // Recency (more recent = higher score)
  const ageInDays = (Date.now() - item.timestamp) / (24 * 60 * 60 * 1000);
  score += Math.max(0, 10 - ageInDays); // 10 points for today, 0 for 10+ days old

  // Source credibility
  const sourceScores = {
    official: 15,
    youtube: 8,
    reddit: 7,
    forum: 5
  };
  score += sourceScores[item.source] || 0;

  // Alert priority
  if (item.isAlert) {
    const alertScores = {
      opportunity: 20,
      warning: 18,
      update: 12
    };
    score += alertScores[item.alertType] || 0;
  }

  // Engagement (social proof)
  if (item.upvotes) score += Math.min(item.upvotes / 10, 10); // Max 10 points
  if (item.comments) score += Math.min(item.comments / 5, 5); // Max 5 points

  // Stage relevance
  const stageKeywords = {
    researching: ["how to", "requirements", "cost", "timeline", "worth it"],
    applying: ["application", "documents", "interview", "tips", "approved"],
    approved: ["housing", "jobs", "moving", "shipping", "first month"],
    arrived: ["settling", "culture", "friends", "community", "adapting"]
  };

  const keywords = stageKeywords[userContext.stage];
  const matchCount = keywords.filter(kw =>
    item.title.toLowerCase().includes(kw) ||
    item.snippet.toLowerCase().includes(kw)
  ).length;
  score += matchCount * 3;

  // Visa type match (bonus)
  if (userContext.visaType) {
    const visaMentioned =
      item.title.toLowerCase().includes(userContext.visaType.toLowerCase()) ||
      item.snippet.toLowerCase().includes(userContext.visaType.toLowerCase());
    if (visaMentioned) score += 8;
  }

  return score;
}
```

#### 2.2 Feed Composition Strategy
```typescript
async function composeFeed(userContext) {
  // 1. Get all sources in parallel
  const [alerts, videos, reddit, forums] = await Promise.all([
    checkPolicyAlerts(userContext.destination),
    searchCorridorVideos(userContext.origin, userContext.destination, "experience"),
    fetchRedditPosts(userContext),
    fetchSmartCorridorContent(userContext.origin, userContext.destination, userContext.stage)
  ]);

  // 2. Combine and score
  const allItems = [...alerts, ...videos, ...reddit, ...forums];
  const scoredItems = allItems.map(item => ({
    ...item,
    relevanceScore: scoreRelevance(item, userContext)
  }));

  // 3. Filter low-quality content
  const qualityItems = scoredItems.filter(item => item.relevanceScore > 5);

  // 4. Sort by score
  qualityItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 5. Diversify (don't show 10 Reddit posts in a row)
  const diversified = diversifyBySource(qualityItems);

  // 6. Return top 15
  return diversified.slice(0, 15);
}

function diversifyBySource(items: FeedItem[]): FeedItem[] {
  const result: FeedItem[] = [];
  const sourceCount: Record<string, number> = {};

  for (const item of items) {
    const count = sourceCount[item.source] || 0;

    // Max 3 consecutive items from same source
    if (count < 3) {
      result.push(item);
      sourceCount[item.source] = count + 1;
    } else {
      // Find next item from different source
      const nextDifferent = items.find(i =>
        i.source !== item.source && !result.includes(i)
      );
      if (nextDifferent) {
        result.push(nextDifferent);
        sourceCount[nextDifferent.source] = (sourceCount[nextDifferent.source] || 0) + 1;
        // Reset counter for skipped source
        sourceCount[item.source] = 0;
      }
    }
  }

  return result;
}
```

### Phase 3: Enhanced UI Components (Week 4)

#### 3.1 New Feed Card Component
```tsx
// apps/web/components/dashboard/FeedCard.tsx
"use client";

import { AlertTriangle, Sparkles, Clock, ExternalLink, ThumbsUp, MessageSquare, Youtube, Play } from "lucide-react";

interface FeedCardProps {
  item: {
    source: "official" | "reddit" | "forum" | "youtube";
    type?: "alert" | "video" | "discussion";
    title: string;
    snippet: string;
    url: string;
    timestamp: number;
    isAlert?: boolean;
    alertType?: "opportunity" | "warning" | "update";
    // Engagement metrics
    upvotes?: number;
    comments?: number;
    views?: number;
    // Video specific
    thumbnail?: string;
    duration?: string;
    channel?: string;
  };
}

export function FeedCard({ item }: FeedCardProps) {
  const timeAgo = getTimeAgo(item.timestamp);

  // Alert styling
  const alertStyles = {
    opportunity: "border-l-4 border-green-500 bg-green-50",
    warning: "border-l-4 border-red-500 bg-red-50",
    update: "border-l-4 border-blue-500 bg-blue-50"
  };

  const cardStyle = item.isAlert
    ? alertStyles[item.alertType!]
    : "border-l-4 border-gray-200";

  return (
    <div className={`border-4 border-black bg-white shadow-[2px_2px_0_0_#000] p-4 hover:shadow-[4px_4px_0_0_#000] transition-shadow ${cardStyle}`}>
      {/* Header: Source badge + timestamp */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <SourceBadge source={item.source} />
          {item.isAlert && <AlertBadge type={item.alertType!} />}
        </div>
        <span className="text-xs text-gray-500">{timeAgo}</span>
      </div>

      {/* Video thumbnail (if applicable) */}
      {item.type === "video" && item.thumbnail && (
        <div className="relative mb-3 group cursor-pointer">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-48 object-cover border-2 border-black"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={48} className="text-white" />
          </div>
          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black text-white px-2 py-1 text-xs font-bold">
              {item.duration}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="font-bold text-lg mb-2 line-clamp-2">
        {item.title}
      </h3>

      {/* Snippet */}
      <p className="text-gray-700 text-sm mb-3 line-clamp-3">
        {item.snippet}
      </p>

      {/* Engagement metrics */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
        {item.upvotes !== undefined && (
          <div className="flex items-center gap-1">
            <ThumbsUp size={14} />
            <span>{formatNumber(item.upvotes)}</span>
          </div>
        )}
        {item.comments !== undefined && (
          <div className="flex items-center gap-1">
            <MessageSquare size={14} />
            <span>{formatNumber(item.comments)}</span>
          </div>
        )}
        {item.views !== undefined && (
          <div className="flex items-center gap-1">
            <Youtube size={14} />
            <span>{formatNumber(item.views)} views</span>
          </div>
        )}
      </div>

      {/* Footer: View link */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm"
      >
        View {item.type === "video" ? "Video" : "Full Post"}
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const badges = {
    official: { icon: "🏛️", text: "Official", color: "bg-purple-100 text-purple-800" },
    reddit: { icon: "👥", text: "Reddit", color: "bg-orange-100 text-orange-800" },
    forum: { icon: "💬", text: "Forum", color: "bg-blue-100 text-blue-800" },
    youtube: { icon: "🎥", text: "YouTube", color: "bg-red-100 text-red-800" }
  };

  const badge = badges[source];

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold border-2 border-black ${badge.color}`}>
      {badge.icon} {badge.text}
    </span>
  );
}

function AlertBadge({ type }: { type: string }) {
  const badges = {
    opportunity: { icon: <Sparkles size={14} />, text: "Opportunity", color: "bg-green-200 text-green-900" },
    warning: { icon: <AlertTriangle size={14} />, text: "Warning", color: "bg-red-200 text-red-900" },
    update: { icon: <Clock size={14} />, text: "Update", color: "bg-blue-200 text-blue-900" }
  };

  const badge = badges[type];

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold border-2 border-black flex items-center gap-1 ${badge.color}`}>
      {badge.icon} {badge.text}
    </span>
  );
}
```

---

## 💰 Cost Analysis

### YouTube Data API
- **Free Tier**: 10,000 quota units/day
- **Search cost**: 100 units per query
- **Max searches**: 100/day = FREE

#### Quota Management Strategy:
```typescript
// apps/web/lib/youtube-quota.ts
let dailyQuotaUsed = 0;
let quotaResetDate = new Date().toDateString();

async function checkQuota(cost: number): Promise<boolean> {
  const today = new Date().toDateString();

  // Reset counter if new day
  if (today !== quotaResetDate) {
    dailyQuotaUsed = 0;
    quotaResetDate = today;
  }

  // Check if we have quota left
  if (dailyQuotaUsed + cost > 9500) { // Leave 500 buffer
    console.warn('YouTube quota exhausted for today');
    return false;
  }

  dailyQuotaUsed += cost;
  return true;
}

async function searchWithQuotaLimit(query: string) {
  const hasQuota = await checkQuota(100); // Search costs 100 units

  if (!hasQuota) {
    // Return cached results or skip
    return getCachedYouTubeResults(query);
  }

  // Proceed with search
  return youtube.search.list({...});
}
```

#### Caching Strategy:
- Cache YouTube search results for 7 days
- Only search once per corridor per week
- Prioritize high-traffic corridors (US→JP, UK→CA, etc.)
- Limit to 10 searches/day = 70 corridors covered per week

### Tavily API
- **Free Tier**: 1,000 credits/month
- **Usage**: 30 corridors × 1 search/day = 900/month = FREE
- **Overflow**: $0.008/request = ~$2.40/month for extra

### Perplexity Search API
- **Cost**: $5/1,000 requests
- **Usage**: 30 corridors × 1 check/day = 900/month = $4.50/month

### Firecrawl (current)
- **Usage**: 1,000 pages/month = $16-20/month

**Total Monthly Cost**: ~$23-27/month for 30 active corridors

---

## 📊 Success Metrics

### User Engagement
- **Click-through rate** on feed items
- **Time spent** on feed page
- **Saves/bookmarks** of useful posts
- **Shares** to other users

### Content Quality
- **Relevance score** (user feedback)
- **Freshness** (% of items < 7 days old)
- **Diversity** (% balance across sources)
- **Alert accuracy** (false positive rate)

### Business Impact
- **Daily active users** checking feed
- **Conversion** (feed view → action taken)
- **Retention** (users coming back for feed)
- **Corridor coverage** (% with fresh content)

---

## 🚀 Implementation Timeline

### Week 1: Foundation
- [ ] Set up YouTube Data API
- [ ] Integrate Tavily for smart search
- [ ] Implement relevance scoring
- [ ] Create basic FeedCard component

### Week 2: Content Aggregation
- [ ] Add Perplexity for alerts
- [ ] Enhance Reddit filtering (Japan-specific)
- [ ] Implement diversification algorithm
- [ ] Add engagement metrics

### Week 3: UI/UX Polish
- [ ] Design alert cards with visual hierarchy
- [ ] Add video thumbnails and playback
- [ ] Implement skeleton loaders
- [ ] Add empty states with helpful CTAs

### Week 4: Testing & Optimization
- [ ] A/B test different feed compositions
- [ ] Optimize API costs
- [ ] Add caching layers
- [ ] Collect user feedback

---

## 🎯 Next Steps

1. **Approve this plan** - Review and provide feedback
2. **API setup** - Get YouTube API key, confirm Tavily/Perplexity keys
3. **Start implementation** - Begin with Week 1 tasks
4. **Iterate based on data** - Monitor engagement and adjust

---

## 🎬 Enhanced Features: Gemini + Save to Vault

### Feature 1: Gemini Video Transcript Summaries

**Problem**: YouTube descriptions are generic and don't tell users if a 20-minute video is worth watching.

**Solution**: Use Gemini to analyze video transcripts and provide:
- **TL;DR summary** (2-3 actionable sentences)
- **Key timestamps** (jump to important sections)
- **Expected learnings** (what you'll get from watching)

#### Implementation

```typescript
// apps/web/lib/gemini-video.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from 'youtube-transcript';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

async function analyzeVideoTranscript(videoId: string) {
  try {
    // 1. Get transcript from YouTube
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript.map(item => item.text).join(' ');

    // 2. Send to Gemini for analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze this YouTube video transcript about immigration/moving abroad.

Transcript:
${fullText.slice(0, 10000)} // Limit for token efficiency

Provide:
1. A 2-3 sentence TL;DR focusing on actionable migration advice
2. 3 key timestamps with topics (format: MM:SS - Topic)
3. One sentence on "You'll learn:" (concrete takeaways)

Format as JSON:
{
  "summary": "...",
  "keyTimestamps": [
    {"time": "2:15", "topic": "Apartment deposits explained"},
    ...
  ],
  "youllLearn": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const analysis = JSON.parse(text);

    // 3. Cache the result (don't re-analyze same video)
    await cacheVideoAnalysis(videoId, analysis);

    return analysis;
  } catch (error) {
    console.error('Error analyzing video:', error);
    return null;
  }
}

// Cache video analyses in Convex
async function cacheVideoAnalysis(videoId: string, analysis: any) {
  await convex.mutation(api.videoAnalysis.save, {
    videoId,
    analysis,
    analyzedAt: Date.now()
  });
}

async function getVideoAnalysis(videoId: string) {
  // Check cache first
  const cached = await convex.query(api.videoAnalysis.get, { videoId });

  if (cached && Date.now() - cached.analyzedAt < 7 * 24 * 60 * 60 * 1000) {
    // Use cached if less than 7 days old
    return cached.analysis;
  }

  // Otherwise, analyze
  return analyzeVideoTranscript(videoId);
}
```

#### Convex Schema

```typescript
// convex/schema.ts
videoAnalysis: defineTable({
  videoId: v.string(),
  analysis: v.object({
    summary: v.string(),
    keyTimestamps: v.array(v.object({
      time: v.string(),
      topic: v.string()
    })),
    youllLearn: v.string()
  }),
  analyzedAt: v.number()
}).index("by_video_id", ["videoId"]),
```

#### Updated Video Card Component

```tsx
// apps/web/components/dashboard/VideoFeedCard.tsx
export function VideoFeedCard({ item }: { item: VideoFeedItem }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAnalysis() {
      setLoading(true);
      const videoId = extractVideoId(item.url);
      const result = await fetch(`/api/analyze-video?id=${videoId}`);
      const data = await result.json();
      setAnalysis(data.analysis);
      setLoading(false);
    }

    loadAnalysis();
  }, [item.url]);

  return (
    <div className="border-4 border-black bg-white shadow-[2px_2px_0_0_#000] p-4">
      {/* Thumbnail */}
      <div className="relative mb-3 group cursor-pointer">
        <img src={item.thumbnail} alt={item.title} className="w-full h-48 object-cover border-2 border-black" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={48} className="text-white" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black text-white px-2 py-1 text-xs font-bold">
          {item.duration}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg mb-2">{item.title}</h3>

      {/* Gemini AI Summary */}
      {loading ? (
        <div className="bg-gray-100 p-3 rounded mb-3 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
        </div>
      ) : analysis ? (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-black p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-purple-600" />
            <span className="text-xs font-bold text-purple-900">AI SUMMARY</span>
          </div>

          <p className="text-sm mb-3">{analysis.summary}</p>

          {analysis.keyTimestamps && (
            <div className="mb-2">
              <p className="text-xs font-bold mb-1">Key Timestamps:</p>
              {analysis.keyTimestamps.map((ts, i) => (
                <div key={i} className="text-xs text-gray-700">
                  • <span className="font-mono text-blue-600">{ts.time}</span> - {ts.topic}
                </div>
              ))}
            </div>
          )}

          {analysis.youllLearn && (
            <div className="mt-2 pt-2 border-t border-purple-200">
              <p className="text-xs">
                <span className="font-bold text-purple-900">💡 You'll learn:</span>{' '}
                {analysis.youllLearn}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Channel & Stats */}
      <div className="text-sm text-gray-600 mb-3">
        📺 {item.channel} · {formatNumber(item.views)} views
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-red-600 text-white text-center py-2 px-4 border-2 border-black font-bold hover:bg-red-700"
        >
          Watch on YouTube
        </a>
        <button
          onClick={() => handleSaveToVault(item, analysis)}
          className="px-4 py-2 border-2 border-black font-bold hover:bg-gray-100"
          title="Save to Document Vault"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}
```

---

### Feature 2: Save Feed Items to Document Vault

**Problem**: Feed items are ephemeral - users can't save important posts for later.

**Solution**: One-click save to Document Vault with optional notes.

#### Implementation

```typescript
// convex/savedFeedItems.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveFeedItem = mutation({
  args: {
    feedItem: v.object({
      source: v.string(),
      type: v.optional(v.string()),
      title: v.string(),
      snippet: v.string(),
      url: v.string(),
      timestamp: v.number(),
      // Optional fields
      thumbnail: v.optional(v.string()),
      upvotes: v.optional(v.number()),
      comments: v.optional(v.number()),
      // Gemini analysis
      aiSummary: v.optional(v.object({
        summary: v.string(),
        keyTimestamps: v.optional(v.array(v.object({
          time: v.string(),
          topic: v.string()
        }))),
        youllLearn: v.optional(v.string())
      }))
    }),
    category: v.string(), // "Housing", "Visa", "Jobs", etc.
    userNotes: v.optional(v.string()),
    corridorId: v.id("corridors")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if already saved
    const existing = await ctx.db
      .query("savedFeedItems")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", identity.subject).eq("url", args.feedItem.url)
      )
      .first();

    if (existing) {
      // Update notes if saving again
      await ctx.db.patch(existing._id, {
        userNotes: args.userNotes,
        updatedAt: Date.now()
      });
      return existing._id;
    }

    // Save new item
    return await ctx.db.insert("savedFeedItems", {
      userId: identity.subject,
      corridorId: args.corridorId,
      feedItem: args.feedItem,
      category: args.category,
      userNotes: args.userNotes,
      savedAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const getSavedItems = query({
  args: {
    corridorId: v.optional(v.id("corridors")),
    category: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let query = ctx.db
      .query("savedFeedItems")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject));

    const items = await query.collect();

    // Filter by corridor and category if provided
    let filtered = items;
    if (args.corridorId) {
      filtered = filtered.filter(item => item.corridorId === args.corridorId);
    }
    if (args.category) {
      filtered = filtered.filter(item => item.category === args.category);
    }

    // Sort by saved date (newest first)
    return filtered.sort((a, b) => b.savedAt - a.savedAt);
  }
});
```

#### Schema Addition

```typescript
// convex/schema.ts
savedFeedItems: defineTable({
  userId: v.string(),
  corridorId: v.id("corridors"),
  feedItem: v.object({
    source: v.string(),
    type: v.optional(v.string()),
    title: v.string(),
    snippet: v.string(),
    url: v.string(),
    timestamp: v.number(),
    thumbnail: v.optional(v.string()),
    upvotes: v.optional(v.number()),
    comments: v.optional(v.number()),
    aiSummary: v.optional(v.object({
      summary: v.string(),
      keyTimestamps: v.optional(v.array(v.object({
        time: v.string(),
        topic: v.string()
      }))),
      youllLearn: v.optional(v.string())
    }))
  }),
  category: v.string(),
  userNotes: v.optional(v.string()),
  savedAt: v.number(),
  updatedAt: v.number()
})
  .index("by_user", ["userId"])
  .index("by_user_and_url", ["userId", "feedItem.url"])
  .index("by_corridor", ["corridorId"]),
```

#### Save Modal Component

```tsx
// apps/web/components/dashboard/SaveFeedItemModal.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Check } from "lucide-react";

export function SaveFeedItemModal({ item, onClose, corridorId }) {
  const [category, setCategory] = useState("General");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const saveFeedItem = useMutation(api.savedFeedItems.saveFeedItem);

  const categories = [
    "General",
    "Visa Information",
    "Housing",
    "Jobs & Employment",
    "Cost of Living",
    "Cultural Tips",
    "Documents",
    "Transportation",
    "Healthcare"
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFeedItem({
        feedItem: item,
        category,
        userNotes: notes || undefined,
        corridorId
      });

      // Show success toast
      toast.success("Saved to Document Vault!");
      onClose();
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] max-w-lg w-full">
        {/* Header */}
        <div className="bg-blue-500 border-b-4 border-black p-4 flex items-center justify-between">
          <h3 className="font-bold text-white">Save to Document Vault</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Item Preview */}
          <div className="border-2 border-black p-3 bg-gray-50">
            <p className="font-bold text-sm mb-1">{item.title}</p>
            <p className="text-xs text-gray-600">{item.snippet.slice(0, 100)}...</p>
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-2 border-black p-2 font-mono"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold mb-2">Your Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes about why you saved this..."
              className="w-full border-2 border-black p-2 font-mono h-24 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-4 border-black p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-black py-2 px-4 font-bold hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-500 text-white border-2 border-black py-2 px-4 font-bold hover:bg-green-600 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Check size={18} />
                Save to Vault
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Document Vault Integration

Add a new tab in Document Vault for "Saved Feed Items":

```tsx
// apps/web/app/[locale]/(dashboard)/documents/page.tsx
export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<"documents" | "saved-feed">("documents");
  const savedItems = useQuery(api.savedFeedItems.getSavedItems);

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b-4 border-black mb-6">
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-6 py-3 font-bold border-r-4 border-black ${
            activeTab === "documents" ? "bg-yellow-100" : "bg-white"
          }`}
        >
          📄 My Documents
        </button>
        <button
          onClick={() => setActiveTab("saved-feed")}
          className={`px-6 py-3 font-bold ${
            activeTab === "saved-feed" ? "bg-yellow-100" : "bg-white"
          }`}
        >
          💾 Saved Feed Items
        </button>
      </div>

      {/* Content */}
      {activeTab === "documents" ? (
        <DocumentVault />
      ) : (
        <SavedFeedItems items={savedItems} />
      )}
    </div>
  );
}
```

---

## 💰 Updated Cost Analysis

### New APIs:

**Gemini 2.0 Flash** (for video transcripts):
- **Free Tier**: 1,500 requests/day
- **Usage**: ~30 videos/day analyzed = FREE
- **Overflow**: Very low cost ($0.075 per 1M input tokens)

**YouTube Transcript API** (npm package):
- **Cost**: FREE (scrapes public captions)
- **No API key needed**

### Total Monthly Cost (Updated):
- Tavily: $7/month
- Perplexity: $5/month
- Firecrawl: $16/month
- YouTube Data API: FREE
- Gemini for transcripts: FREE (within quota)
- **Total: ~$28/month**

---

## Questions for You

1. **User Journey Stages**: Do we track user stage (researching/applying/etc.) in the database?
2. **Visa Types**: Should we ask users their visa type for better filtering?
3. **Video Preferences**: Any specific YouTube channels to prioritize?
4. **Budget**: Is ~$28/month API cost acceptable for this feature?
5. **Priority**: Which should we implement first?
   - 🚨 Alerts System (Perplexity)
   - 🎥 Gemini Video Summaries
   - 💾 Save to Vault
   - 🔍 Smart Search (Tavily)
