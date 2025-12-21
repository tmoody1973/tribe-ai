# TRIBE Brainstorming Session Results

**Session Date:** December 2024
**Focus:** Comprehensive exploration - data, architecture, UX, differentiation, monetization
**Approach:** Progressive flow (broad → focused)

---

## Executive Summary

**TRIBE - The Diaspora Intelligence Network** solves the fragmented knowledge problem for 281 million people living outside their birth country. Critical migration knowledge is trapped in WhatsApp groups, scattered Reddit threads, and Facebook communities. TRIBE aggregates and synthesizes this diaspora community knowledge, delivering personalized, sequenced intelligence for any migration corridor.

### Key Decisions Locked

| Decision | Choice |
|----------|--------|
| Corridors | Dynamic (any corridor via Mastra agent) |
| Data sources | Structured APIs + Community ingestion + Perplexity real-time |
| Synthesis | Two-stage: batch extraction → query-time RAG |
| Voice | ElevenLabs (TTS briefings + conversational agent) |
| UI Framework | RetroUI (neobrutalist aesthetic) |
| Primary moat | Sequenced protocols with attribution |
| Monetization | Freemium + B2B + Sponsorship |

---

## The North Star: Amara's Story

*This narrative defines the core product experience.*

Amara steps off the plane at Berlin Brandenburg, her Blue Card approval letter folded in her jacket pocket. She's a software engineer from Lagos, and she's spent six months preparing for this moment—visa interviews, apartment research, language apps, YouTube videos about German culture. She thinks she's ready.

She opens TRIBE in the arrivals hall while waiting for her luggage.

The app recognizes her corridor. Nigeria to Germany. It asks one question: "Have you arrived in Germany?"

She taps yes.

What appears next stops her cold.

**"You have 14 days. Here's the exact order."**

Not tips. Not suggestions. An exact sequence, with specific names, addresses, and warnings from Nigerians who landed before her.

The first card says: **Open an N26 bank account today. Not tomorrow. Today.**

She frowns. Her research said she needs an Anmeldung—the German address registration—before she can open a bank account. Every guide said that.

But TRIBE explains the catch-22 that nobody writes about in official guides: You need an Anmeldung to open a German bank account. But you need an IBAN to pay rent. And you need a rental contract to get an Anmeldung. It's a bureaucratic loop that traps people for weeks.

N26 doesn't require Anmeldung. Fifteen minutes of video verification on her phone. She'll have an IBAN by tonight.

Below that, a quote from someone named Ada who arrived in 2024: *"I spent three weeks trying to figure this out. Just do N26 first. Trust me."*

The second card tells her to book her Bürgeramt appointment right now, not next week. The secret: slots release at 8am on the service.berlin.de website. If she waits until she "settles in," she'll find nothing available for six weeks. The card even tells her which office to choose—Kreuzberg, not Mitte. Forty-five minute wait versus three hours. Someone named Chidi added a warning: *"Don't show up without an appointment. I waited six hours and got turned away."*

The third card breaks down the housing trap. It explains that most landlords won't rent to someone without Anmeldung, but she can't get Anmeldung without an address. The solution: search for "Anmeldung-friendly" sublets on HousingAnywhere or Wunderflats. Get a three-month sublet first. Don't even try to find permanent housing until she has the registration paper in hand.

A software engineer named Tunde who arrived in 2023 left the crucial advice: *"I wasted my first month trying to do it the 'right' way. Get the sublet. Get the Anmeldung. Then you can apartment hunt like a normal person."*

Amara looks up from her phone. Her suitcase is circling on the carousel.

She just learned in sixty seconds what took Tunde a month, what took Chidi six wasted hours, what took Ada three confused weeks. The exact sequence. The specific hacks. The real warnings from real people who made the mistakes so she doesn't have to.

She downloads the checklist, saves the template for the Wohnungsgeberbestätigung—the landlord confirmation letter she'll need—and puts in her earbuds to listen to the five-minute audio briefing while she waits for her Uber.

By the time she reaches her temporary Airbnb, she'll have an N26 account pending, a Bürgeramt appointment booked for next Tuesday at the Kreuzberg office, and a shortlist of Anmeldung-friendly sublets to view this week.

**Three months of hard-won diaspora knowledge, delivered in the time it takes to collect a suitcase.**

---

## Core Insight: Sequenced Intelligence

The key differentiator is not content—it's **sequence with attribution**.

| Traditional Guides | TRIBE |
|-------------------|-------|
| "Here are 5 bank options" | "Do N26 first" |
| "You need to register your address" | "Book Bürgeramt NOW, Kreuzberg not Mitte" |
| Generic tips | Named sources: "Ada, 2024" |
| Static content | Time-sensitive intelligence |

Sequences reveal themselves through **failure patterns**. When fifty people complain about the same catch-22, and thirty people share how they escaped it, the sequence emerges from the gap between their experiences.

---

## Architecture

### Intelligence Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIBE INTELLIGENCE STACK                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: FACTUAL BASELINE (Structured APIs)                    │
│  ├── Travel Buddy API      → Visa requirements                  │
│  ├── Passport Index        → Visa matrix                        │
│  ├── Sherpa API            → Health + travel advisories         │
│  ├── REST Countries        → Country metadata                   │
│  ├── Numbeo API            → Cost of living                     │
│  ├── World Bank API        → Economic indicators                │
│  ├── Open Exchange Rates   → Currency conversion                │
│  └── OpenCage / Nominatim  → Geocoding                          │
│                                                                 │
│  LAYER 2: COMMUNITY WISDOM (Ingested + Agent Research)          │
│  ├── Reddit API            → r/IWantOut, r/expats, country subs │
│  ├── YouTube API           → Journey vlogs, comments            │
│  ├── InterNations          → Established expat forums           │
│  ├── Expatica              → Editorial guides                   │
│  └── Nairaland (& similar) → Origin-country specific forums     │
│                                                                 │
│  LAYER 3: REAL-TIME (Freshness Layer)                           │
│  ├── Perplexity API        → Policy changes, current conditions │
│  └── Tavily                → Web search, gap filling            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Synthesis Pipeline

**Two-stage pipeline, not pure RAG.**

Traditional RAG retrieves chunks at query time. But that doesn't discover sequences—it just finds mentions. Sequence discovery happens in **batch processing**, before any user ever asks a question.

#### Stage 1: Offline Extraction (runs per data refresh)

```
RAW CONTENT
    ↓
CLAUDE EXTRACTION
    Extract: tasks_mentioned, sequence_signals,
    success_patterns, failure_patterns, warnings, hacks
    ↓
STRUCTURED SIGNALS
    { "before": "N26", "after": "housing deposit",
      "reason": "need IBAN to pay", "strength": "strong" }
```

#### Stage 2: Pattern Aggregation

```
SEQUENCE SIGNAL AGGREGATION
    "N26 before housing deposit"     - 127 mentions, 94% agree
    "Anmeldung before German bank"   - 203 mentions, 99% agree
    ↓
DEPENDENCY GRAPH CONSTRUCTION
    Claude builds DAG from aggregated signals
    ↓
ARRIVAL PROTOCOL
    Stored in Convex, ready for retrieval
```

#### Stage 3: Evidence Attachment

For each node in the sequence graph:
- Best success quote (highest engagement + most specific)
- Best failure warning (most visceral + most upvoted)
- Best hack (most actionable + most confirmed)

#### Stage 4: Query-Time Retrieval

```
User Context: Nigeria → Germany, Just Arrived
    ↓
Fetch pre-computed protocol from Convex
    ↓
Check freshness (>30 days? → Perplexity refresh)
    ↓
Render to UI (no Claude call needed for display)
```

**For specific Q&A:** RAG retrieval from Voyage embeddings + Claude synthesis + Perplexity for gaps.

---

## Dynamic Corridor Agent

Instead of pre-computing fixed corridors, a **Mastra agent** researches ANY corridor on demand.

```
┌─────────────────────────────────────────────────────────────────┐
│  USER INPUT: "I'm moving from Kenya to Netherlands"            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MASTRA CORRIDOR AGENT                                          │
│                                                                 │
│  Agent thinks: "Kenya → Netherlands. Let me research."          │
│                                                                 │
│  PARALLEL TOOL CALLS:                                           │
│  ├── Tavily: "Kenyans moving to Netherlands visa"               │
│  ├── Tavily: "Kenyan community Netherlands Reddit"              │
│  ├── Reddit API: search r/Netherlands, r/Kenya, r/IWantOut      │
│  ├── YouTube API: "Kenya to Netherlands move experience"        │
│  ├── Perplexity: "Netherlands residence permit Kenya citizens"  │
│  ├── Travel Buddy: Visa requirements                            │
│  ├── REST Countries: Netherlands metadata                       │
│  └── Numbeo: Cost of living comparison                          │
│                                                                 │
│  SYNTHESIS:                                                     │
│  ├── Extract signals (success/failure/dependency)               │
│  ├── Build sequence graph                                       │
│  ├── Attach best evidence                                       │
│  └── Generate Arrival Protocol                                  │
│                                                                 │
│  CACHE: Store in Convex for future users                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Definition (Mastra)

```typescript
export const corridorResearcher = new Agent({
  name: 'CorridorResearcher',
  description: 'Researches any migration corridor dynamically',

  tools: [
    // Factual baseline
    travelBuddyTool,
    passportIndexTool,
    restCountriesTool,
    numbeoTool,
    openCageTool,

    // Community wisdom
    tavilySearchTool,
    perplexityTool,
    redditSearchTool,
    youtubeSearchTool,

    // Storage
    voyageEmbedTool,
    convexStoreTool,
  ],

  model: claude,

  systemPrompt: `
    You are a migration corridor research agent.

    Given an origin and destination country:
    1. Search for community experiences (Reddit, YouTube, forums)
    2. Find official requirements (visa, permits, registration)
    3. Extract success patterns, failure patterns, and dependencies
    4. Build a sequenced Arrival Protocol
    5. Attach real quotes with attribution
    6. Store the synthesized protocol

    Always prioritize recent sources (2023-2024).
    Always look for origin-country-specific communities.
    Always identify the critical "catch-22" bureaucratic loops.
  `,
});
```

### Corridor Handling

| Scenario | Agent Behavior |
|----------|----------------|
| **Popular corridor** (NG→DE) | Rich data, high-confidence protocol |
| **Medium corridor** (KE→NL) | Decent data, some gaps filled by Perplexity |
| **Rare corridor** (Bhutan→Chile) | Limited community data, relies on official sources |
| **Cached corridor** | Skip research, return stored protocol |
| **Stale corridor** (>30 days) | Re-run agent to refresh |

---

## Voice Layer (ElevenLabs)

### Two Modes

| Mode | Purpose | Tech |
|------|---------|------|
| **Audio Briefings** | NPR-style, passive listening | Claude script → ElevenLabs TTS |
| **Voice Agent** | Interactive Q&A, hands-free | ElevenLabs STT → Claude → ElevenLabs TTS |

### Audio Briefing Examples

**Planning Stage:**
> "This week in Nigeria→Germany: Blue Card processing times dropped to 6 weeks. Three new IT jobs posted in Berlin match your profile. Community tip: start your German A1 course now—it's not required but helps with housing applications."

**Pre-departure Stage:**
> "14 days until your flight. Checklist: passport valid for 6+ months ✓, Blue Card approval ✓, travel insurance pending. Book your first week accommodation today—here's why that matters for your Anmeldung..."

**Arrival Stage:**
> "Good morning, Amara. Day 3 in Berlin. Your Bürgeramt appointment is tomorrow at 10am at the Kreuzberg office on Yorckstraße. Three things to bring: passport, rental contract, and the Wohnungsgeberbestätigung from your landlord."

### Voice Agent Flow

```
User speaks: "Can I use my Nigerian driver's license here?"
    ↓
ElevenLabs STT (speech-to-text)
    ↓
Claude RAG (retrieve + synthesize)
    ↓
Response: "Your Nigerian license is valid for 6 months
after you register your address. After that, you'll need
to convert it. In Berlin, you need to take a practical
test but not the written exam. Want me to add 'Start
license conversion' to your checklist for month 2?"
    ↓
ElevenLabs TTS (text-to-speech)
    ↓
User hears answer
```

---

## Complete Tech Stack

```
FRONTEND
├── Next.js 14 (App Router)
├── Tailwind CSS
├── RetroUI (neobrutalist components)
├── React Flow (pathway visualization)
├── Mapbox (corridor maps)
└── Framer Motion (animations)

BACKEND / DATABASE
├── Convex (real-time DB + serverless functions)
├── Clerk (authentication)
└── Upstash (rate limiting, caching)

AI LAYER
├── Claude API (synthesis, RAG, reasoning)
├── ElevenLabs (TTS briefings + voice agent STT/TTS)
├── Voyage AI (embeddings for semantic search)
├── Tavily (web search, source discovery)
├── Perplexity API (real-time gap filling, freshness)
└── Mastra (agentic orchestration)

DATA SOURCES - STRUCTURED APIs
├── Travel Buddy API (visa requirements)
├── Passport Index Dataset (visa matrix → Convex)
├── Sherpa API (health + travel advisories)
├── REST Countries (country metadata)
├── Numbeo API (cost of living)
├── World Bank API (economic indicators)
├── Open Exchange Rates (currency conversion)
└── OpenCage / Nominatim (geocoding)

DATA SOURCES - COMMUNITY
├── Reddit API (r/IWantOut, r/expats, country subs)
├── YouTube API (journey vlogs, comments)
├── InterNations (expat forums)
└── Expatica (editorial guides)

INFRASTRUCTURE
├── Vercel (deployment)
├── Resend (email notifications)
├── Stripe (subscriptions - post-MVP)
├── Sentry (error monitoring)
└── PostHog (analytics)
```

---

## Competitive Moat (Ranked)

| Rank | Moat | Description |
|------|------|-------------|
| **#1** | Sequenced protocols | "Do N26 first" beats generic tips |
| **#2** | Multi-modal delivery | Dashboard + Q&A + Voice |
| **#3** | Data aggregation | Unified view of fragmented sources |
| **#4** | Cultural context | Origin-country specific (Nigerians helping Nigerians) |
| **#5** | Network effects | Mentors, contributions (post-MVP) |
| **#5** | Attribution | Named sources build trust |

---

## Monetization Model

### Revenue Streams

| Stream | Free Tier | Paid Tier |
|--------|-----------|-----------|
| **Freemium** | Dashboard, corridor scores, 3 Q&A/day, sample audio | Unlimited Q&A, daily briefings, mentors, alerts ($15/mo) |
| **B2B** | — | Relocation agencies, employers, law firms, universities ($500/mo API) |
| **Sponsorship** | — | Wise, N26, Revolut, SafetyWing, Spotahome, SendMyBag |

### Why This Works

- **Freemium** builds user base and proves value
- **B2B** is where real money is ($5-10K per international hire on relocation)
- **Sponsorship** is native (recommending Wise in banking content is helpful, not intrusive)

### Phasing

- Months 1-6: Free (growth)
- Months 6-12: Premium tier launch
- Year 2: B2B pilot + sponsorship

---

## 2-Week Hackathon Sprint Plan

### Week 1: Foundation

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1-2 | Infra | Next.js + Convex + Clerk + Vercel + RetroUI scaffold |
| 2-3 | Corridor Agent | Mastra agent with Tavily/Perplexity/Reddit/YouTube tools |
| 3-4 | Synthesis Pipeline | Claude extraction prompts, protocol schema in Convex |
| 4-5 | Test corridors | Run agent on 3-5 corridors, validate output quality |

### Week 2: Experience

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 6-7 | Dashboard UI | Corridor selector, protocol cards, attribution display |
| 8-9 | AI Q&A | RAG with Voyage embeddings, Claude synthesis |
| 10-11 | Voice | ElevenLabs TTS briefings + conversational agent |
| 12-13 | Polish | Mobile responsive, loading states, error handling |
| 14 | Demo | Record demo, deploy, submit |

---

## User Journey Stages

TRIBE supports all stages of the migration journey:

```
PLANNING        → PRE-DEPARTURE    → ARRIVAL         → SETTLING
(6-12 months)     (0-3 months)       (first 30 days)   (months 2-6)
     ↓                 ↓                  ↓                ↓
Corridor         Prep checklists    Arrival Protocol   Integration
research         Document prep      Critical sequence  Long-term setup
Visa pathways    Bookings           Time-sensitive     Community
Cost analysis    Language prep      "14-day clock"     connection
```

### Feature Mapping

| Feature | Planning | Pre-departure | Arrival |
|---------|----------|---------------|---------|
| **Dashboard** | Corridor overview | Prep checklist | Protocol cards |
| **AI Q&A** | "What visa do I need?" | "What documents?" | "Where's the Bürgeramt?" |
| **Audio Briefings** | Weekly updates | Daily countdown | Morning briefing |

---

## Reddit Sub Strategy by Corridor

| Corridor | Subreddits |
|----------|------------|
| **Nigeria → Germany** | r/germany, r/berlin, r/IWantOut, r/Nigeria, r/cscareerquestionsEU |
| **India → Canada** | r/canada, r/ImmigrationCanada, r/india, r/ExpressEntry |
| **Brazil → Portugal** | r/portugal, r/PortugalExpats, r/brasil |
| **Philippines → UAE** | r/dubai, r/UAE, r/Philippines |
| **UK → Australia** | r/australia, r/AusVisa, r/unitedkingdom |
| **Universal** | r/IWantOut, r/expats, r/immigration |

---

## Perplexity Trigger Logic

Hybrid approach for when to call Perplexity:

| Trigger | Example |
|---------|---------|
| **Time-sensitive topics** | Visa policy changes, appointment availability |
| **Confidence threshold** | Claude uncertain about cached answer |
| **User flags gap** | "This info seems outdated" |
| **Stale data** | Protocol >30 days old |

---

## What Makes TRIBE Different

| ChatGPT | TRIBE |
|---------|-------|
| Generic advice from training data | Corridor-specific sequences |
| "You need to register your address" | "Book Bürgeramt NOW, Kreuzberg office" |
| No attribution | "Ada, 2024" with source link |
| No community validation | Upvotes, confirmations, recency |
| Text only | Dashboard + Q&A + Voice |

**The intelligence isn't artificial. It's aggregated human experience, structured for immediate action.**

---

## Future Features (Post-MVP)

- **Mentor Matching** — Connect with people who've made your journey
- **Policy Alerts** — Real-time immigration policy change notifications
- **Credential Verification** — "Will my degree be recognized?"
- **Document Templates** — Pre-filled forms for each corridor
- **Community Contributions** — Users add their own experiences
- **Pathway Visualization** — Interactive Mapbox corridors

---

## Session Artifacts

- **Amara Story**: North star UX narrative
- **Architecture Diagrams**: Intelligence stack, synthesis pipeline
- **Agent Definition**: Mastra corridor researcher
- **Tech Stack**: Complete API and infrastructure list
- **Sprint Plan**: 2-week hackathon breakdown
- **Moat Ranking**: Prioritized competitive advantages
- **Monetization Model**: Freemium + B2B + Sponsorship

---

*Generated from TRIBE brainstorming session using BMad Method*
