# TRIBE Product Requirements Document (PRD)

**Version:** 1.5
**Date:** December 29, 2025
**Status:** Draft

---

## 1. Goals and Background Context

### 1.1 Goals

- Deliver personalized, sequenced migration intelligence for any corridor in under 60 seconds
- Provide multi-modal access: dashboard, AI Q&A, audio briefings, and voice agent
- Support 5 languages at MVP (English, Yoruba, Hindi, Portuguese, Tagalog)
- Enable dynamic corridor research via AI agent (not limited to pre-computed corridors)
- Build trust through real source attribution from community experiences
- Achieve <5 second response times for Q&A and <1 second for voice interactions
- Complete functional MVP within 2-week hackathon timeline

### 1.2 Background Context

281 million people live outside their birth country, yet critical migration knowledge remains fragmented across WhatsApp groups, Reddit threads, and Facebook communities. Migrants spend months gathering information that could be synthesized in minutes. Existing solutions fail because they provide generic guidance without understanding the critical sequences and catch-22 traps that define real migration experiences.

TRIBE solves this by aggregating community wisdom into actionable, sequenced protocols—telling users not just what to do, but in what order, with attribution to real people who've made the journey. The platform serves users across their entire migration journey: planning, pre-departure, arrival, and settling—all in their native language.

The 2-week hackathon constraint requires ruthless prioritization. The MVP focuses on proving the core value proposition: synthesized corridor intelligence with multi-modal delivery.

### 1.3 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| Dec 2025 | 1.0 | Initial PRD draft from Project Brief | John (PM) |
| Dec 2025 | 1.1 | Added Firecrawl for web scraping/ingestion | John (PM) |
| Dec 2025 | 1.2 | Added CopilotKit + AG-UI for agentic chat and Generative UI | John (PM) |
| Dec 2025 | 1.3 | Added Epic 6: Cultural Bridge & Inclusion (FR24-FR29) | Claude |
| Dec 27, 2025 | 1.4 | Added Epic 8: Live Corridor Feed with multi-source intelligence, Gemini video analysis, Threads/Twitter UI, and Document Vault integration (FR30-FR40, NFR15-NFR19) | Claude |
| Dec 29, 2025 | 1.5 | Added Epic 9: Financial Tracker & Budget Management with CSV import, AI categorization, savings goals, exchange rates (FR41-FR52, NFR20-NFR23). Enhanced Epic 5 with hyper-personalized audio briefings using 10 data sources (FR53-FR60, NFR24-NFR26) | John (PM) |

---

## 2. Requirements

### 2.1 Functional Requirements

- **FR1:** System shall provide onboarding flow capturing language preference, origin country, destination country, current stage (Planning/Pre-departure/Arrived/Settled), and optional visa type
- **FR2:** System shall localize all UI elements to user's selected language using next-intl
- **FR3:** System shall display corridor dashboard with synthesized Arrival Protocol for any origin→destination pair
- **FR4:** System shall show sequenced protocol steps with real source attribution (author name, date, source link)
- **FR5:** System shall provide cost of living comparison between origin and destination using Numbeo API
- **FR6:** System shall display visa requirements baseline using Travel Buddy API and Passport Index dataset
- **FR7:** System shall enable progress tracking with checklist of completed protocol steps persisted to user profile
- **FR8:** System shall provide AI Q&A feature accepting natural language questions about user's corridor
- **FR9:** System shall synthesize Q&A answers using RAG over ingested community content via Voyage AI embeddings + Claude
- **FR10:** System shall fall back to Perplexity API for real-time policy questions or when cached knowledge is insufficient
- **FR11:** System shall display source attribution on every Q&A answer
- **FR12:** System shall generate and deliver audio briefings personalized to user's stage and corridor
- **FR13:** System shall use ElevenLabs TTS to render audio briefings in user's selected language
- **FR14:** System shall provide voice agent for conversational Q&A using ElevenLabs STT + Claude + TTS pipeline
- **FR15:** System shall implement dynamic corridor research agent using Mastra framework
- **FR16:** System shall cache corridor protocols in Convex and refresh when data is >30 days stale
- **FR17:** System shall translate dynamic content (protocols, Q&A responses, audio scripts) at runtime via Google Cloud Translation API with intelligent caching
- **FR18:** System shall authenticate users via Clerk with email/social login options
- **FR19:** System shall persist user profile (language, corridor, stage, checklist progress) in Convex
- **FR20:** System shall support any corridor dynamically (not limited to pre-defined list)
- **FR21:** System shall ingest community content from forums, blogs, and static websites using Firecrawl for deep web scraping
- **FR22:** System shall use CopilotKit + AG-UI for agentic chat interface with bidirectional state sync between UI and Mastra agents
- **FR23:** System shall support Generative UI where protocol cards are dynamically generated by the synthesis agent
- **FR24:** System shall provide Cultural Profile Builder that captures user's cultural background, values, and communication preferences via AI-guided interview
- **FR25:** System shall generate shareable Cultural Cards that explain user's culture to locals (bi-directional cultural education)
- **FR26:** System shall provide Local Customs Decoder explaining destination culture with context and "why" behind practices
- **FR27:** System shall offer Cultural Exchange Matcher connecting migrants with local cultural buddies/allies
- **FR28:** System shall display Belonging Dashboard tracking integration milestones, social connections, and cultural experiences
- **FR29:** System shall provide micro-moment cultural insights (contextual tips for daily situations)
- **FR30:** System shall provide Live Corridor Feed displaying corridor-specific content from multiple sources (Reddit, YouTube, forums, news)
- **FR31:** System shall filter feed content by relevance to user's specific corridor (origin→destination)
- **FR32:** System shall display feed in Threads/Twitter-style interface with infinite scroll and inline media
- **FR33:** System shall allow users to save feed items to Document Vault with categories and notes
- **FR34:** System shall use YouTube Data API to fetch corridor-specific migration videos
- **FR35:** System shall use Gemini AI to analyze YouTube video transcripts and generate TL;DR summaries, key timestamps, and learning outcomes
- **FR36:** System shall use Tavily API for smart search and discovery of migration resources
- **FR37:** System shall use Perplexity API for real-time policy alerts and official announcements
- **FR38:** System shall implement relevance scoring algorithm that ranks content by recency, source credibility, engagement, and journey stage match
- **FR39:** System shall respect YouTube API quota limits (10K units/day) with intelligent caching and prioritization
- **FR40:** System shall categorize feed items by type: Alerts, Success Stories, Videos, Discussions, Educational
- **FR41:** System shall provide CSV/Excel import for bank statements with automatic transaction parsing
- **FR42:** System shall use Gemini AI to automatically categorize imported transactions into migration expense categories
- **FR43:** System shall support bulk expense import from parsed CSV data with transaction matching and deduplication
- **FR44:** System shall provide multi-currency expense tracking with automatic conversion to destination currency
- **FR45:** System shall integrate real-time exchange rate API (exchangeratesapi.io with fallback to exchangerate-api.com)
- **FR46:** System shall provide savings goals tracker with target amounts, deadlines, and milestone tracking
- **FR47:** System shall display savings progress with visual progress bars and achievement celebrations
- **FR48:** System shall provide budget creation wizard with corridor-specific templates and allocation suggestions
- **FR49:** System shall calculate and display budget summaries showing spent vs remaining by category
- **FR50:** System shall track upcoming expenses with due date notifications
- **FR51:** System shall provide budget status indicators (on-track, over-budget, under-budget) based on spending pace
- **FR52:** System shall update exchange rates daily via scheduled cron job caching 22 major currency pairs
- **FR53:** System shall generate hyper-personalized audio briefings using 10 data sources: user todos, saved documents, feed alerts, Perplexity (policy news, job market, cultural insights, destination news), corridor statistics, financial data, community wisdom
- **FR54:** System shall structure daily audio briefings in 7 sections: personalized greeting, urgent actions, progress summary, new opportunities, financial check-in, today's focus, motivational close (2-3 minutes total)
- **FR55:** System shall structure weekly audio briefings in 7 sections: week review, corridor intelligence update, financial deep dive, community insights, roadmap for next week, comparative analysis, celebration of milestones (5-7 minutes total)
- **FR56:** System shall generate audio briefing scripts in user's selected language using Claude with dynamic content synthesis
- **FR57:** System shall render audio briefings using Google Cloud Text-to-Speech (Gemini integration) supporting 220+ languages and variants with neural voices
- **FR58:** System shall display audio briefing UI with actionable inline buttons for: save-to-vault, add-to-todos, view-source, and quick-chat
- **FR59:** System shall allow users to select briefing language independent of app UI language
- **FR60:** System shall generate briefing transcripts for accessibility and reference

### 2.2 Non-Functional Requirements

- **NFR1:** Initial page load shall complete in <3 seconds on 4G connection
- **NFR2:** Protocol display shall render in <1 second for cached corridors
- **NFR3:** AI Q&A responses shall return in <5 seconds
- **NFR4:** Voice agent latency shall be <1 second for natural conversation flow
- **NFR5:** Language switching shall complete in <500ms
- **NFR6:** System shall be responsive and mobile-first (primary usage on smartphones)
- **NFR7:** System shall support modern browsers (Chrome, Safari, Firefox, Edge - last 2 versions)
- **NFR8:** API costs shall stay within free tier limits where possible during MVP
- **NFR9:** System shall handle concurrent users without degradation (Vercel/Convex scaling)
- **NFR10:** User data shall be stored securely in Convex (SOC 2 compliant)
- **NFR11:** API keys shall be secured via environment variables, never exposed to client
- **NFR12:** System shall implement rate limiting via Upstash to prevent abuse
- **NFR13:** System shall log errors to Sentry for monitoring and debugging
- **NFR14:** System shall track user analytics via PostHog for product insights
- **NFR15:** Live Corridor Feed shall refresh in <2 seconds for cached content
- **NFR16:** Feed items shall load incrementally with smooth infinite scroll (no janky pagination)
- **NFR17:** YouTube video analyses shall be cached for 7 days to minimize API usage
- **NFR18:** Total API costs for corridor feed shall not exceed $30/month for 30 active corridors
- **NFR19:** Feed relevance algorithm shall filter out 95%+ non-corridor-specific content
- **NFR20:** CSV import shall process and categorize 100 transactions in <10 seconds using Gemini batch analysis
- **NFR21:** Exchange rate API calls shall have fallback mechanism with <2 second failover time
- **NFR22:** Financial tracker shall support offline mode with local storage sync when connection restored
- **NFR23:** Budget calculations shall update in real-time (<500ms) when expenses added or modified
- **NFR24:** Audio briefing generation shall complete in <30 seconds for daily briefing, <60 seconds for weekly briefing
- **NFR25:** Briefing AI synthesis shall stay within Gemini free tier (1,500 requests/day) through intelligent caching
- **NFR26:** Audio briefing player shall support background playback on mobile devices

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

TRIBE delivers a **calm, confident, and trustworthy** experience for users navigating the stress of international migration. The interface should feel like a knowledgeable friend who's already made the journey—direct, practical, and reassuring.

The neobrutalist aesthetic via RetroUI creates visual distinction from generic SaaS products, signaling that TRIBE is different: bold, honest, and human-centered rather than corporate and polished.

### 3.2 Key Interaction Paradigms

- **Progressive Disclosure:** Show the most critical next action prominently; details available on demand
- **Card-Based Protocol Display:** Each step as a distinct, actionable card with attribution
- **Conversational Q&A:** Natural language input with cited, synthesized responses
- **Audio-First Option:** Every screen offers audio alternative for hands-free consumption
- **Checklist Progression:** Satisfying visual feedback as users complete steps
- **Language-Native Experience:** Full localization, not just translated strings

### 3.3 Core Screens and Views

1. **Onboarding Flow** - Language → Origin → Destination → Stage → (Visa Type)
2. **Corridor Dashboard** - Protocol cards, progress tracker, quick stats
3. **Protocol Detail** - Expanded step with full attribution, tips, warnings
4. **AI Q&A Chat** - Conversational interface with source citations
5. **Audio Briefing Player** - Playback controls, transcript toggle
6. **Voice Agent Interface** - Push-to-talk or wake word activation
7. **Profile/Settings** - Language, corridor, stage management

### 3.4 Accessibility

**WCAG AA** compliance target:
- Sufficient color contrast ratios
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Alt text for images
- Audio transcripts available

### 3.5 Branding

- **Visual Style:** RetroUI neobrutalist aesthetic - bold borders, chunky buttons, honest aesthetic
- **Color Palette:** High contrast, accessible colors (specific palette TBD by UX)
- **Typography:** Clear, readable fonts suitable for multiple languages including Yoruba, Hindi, Tagalog
- **Tone:** Confident, practical, warm, peer-to-peer (not corporate)
- **Logo/Identity:** "TRIBE" wordmark with diaspora/network motif (TBD)

### 3.6 Target Platforms

**Web Responsive** - Mobile-first design, works on all screen sizes
- Primary: Mobile web (iPhone, Android browsers)
- Secondary: Desktop web
- Native apps: Out of scope for MVP

---

## 4. Technical Assumptions

### 4.1 Repository Structure

**Monorepo** - Single repository containing:
- `/app` - Next.js 14 application (App Router)
- `/convex` - Convex backend functions and schema
- `/components` - Shared React components
- `/lib` - Utility functions and API clients
- `/messages` - Internationalization JSON files (next-intl)
- `/agents` - Mastra agent definitions
- `/scripts` - Data ingestion and processing scripts

### 4.2 Service Architecture

**Serverless with Real-time Database:**
- **Frontend:** Next.js 14 on Vercel (SSR + Edge functions)
- **Backend:** Convex serverless functions (real-time sync, background jobs)
- **AI Orchestration:** Mastra agents for corridor research
- **Authentication:** Clerk (hosted auth service)
- **Caching:** Upstash Redis for rate limiting and caching

**External API Integrations:**

| Category | Service | Purpose |
|----------|---------|---------|
| **AI - Core** | Google Gemini (gemini-3-flash-preview) | Synthesis, RAG, agent reasoning |
| **AI - Voice** | ElevenLabs | TTS, STT for voice features |
| **AI - Embeddings** | Voyage AI | Semantic search embeddings |
| **AI - Search** | Perplexity API | Real-time web search |
| **AI - Search** | Tavily | Source discovery |
| **AI - Orchestration** | Mastra | Agent framework |
| **AI - UI** | CopilotKit + AG-UI | Agentic chat UI, generative UI, state sync |
| **Web Scraping** | Firecrawl | Deep scraping of forums, blogs, static sites |
| **Data - Visa** | Travel Buddy API | Visa requirements |
| **Data - Cost** | Numbeo API | Cost of living |
| **Data - Countries** | REST Countries | Country metadata |
| **Data - Visa Matrix** | Passport Index Dataset | Visa-free matrix (loaded to Convex) |

### 4.3 Data Ingestion Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIBE DATA INGESTION PIPELINE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DYNAMIC SEARCH (Real-time)                                     │
│  ├── Tavily        → Find new sources for corridor              │
│  └── Perplexity    → Real-time policy queries                   │
│                                                                 │
│  DEEP SCRAPING (Batch) - via Firecrawl                          │
│  ├── Forums        → Nairaland, InterNations, Immigration.com   │
│  ├── Blogs         → Expatica, GaijinPot, CIC News              │
│  ├── Government    → USCIS, IRCC, Make-it-in-Germany, BAMF      │
│  ├── Settlement    → Settlement.org, country-specific guides    │
│  └── Static content → Clean markdown for synthesis              │
│                                                                 │
│  API ACCESS (Structured)                                        │
│  ├── Reddit API    → Subreddit posts, comments                  │
│  ├── YouTube API   → Video metadata, transcripts (if available) │
│  └── Structured APIs → Visa, cost, country data                 │
│                                                                 │
│  OUTPUT → Convex (raw content) → Voyage (embeddings) → Claude   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 CopilotKit + AG-UI Integration

**Reference:** [CopilotKit Docs](https://docs.copilotkit.ai/) | [AG-UI Protocol](https://www.copilotkit.ai/ag-ui) | [Mastra Integration](https://mastra.ai/docs/frameworks/agentic-uis/copilotkit)

CopilotKit with AG-UI (Agent-User Interaction protocol) provides the agentic UI layer for TRIBE:

**Core Packages:**
```
@copilotkit/react-core     # React integration
@copilotkit/react-ui       # Chat components, generative UI
@copilotkit/runtime        # Server runtime
@ag-ui/mastra              # Mastra agent bridge
```

**Key Capabilities Used:**

| Capability | TRIBE Usage |
|------------|-------------|
| **CopilotChat** | Q&A interface with streaming responses |
| **Shared State** | Bidirectional sync of corridor/stage/language with agents |
| **Generative UI** | Dynamic protocol cards generated by synthesis agent |
| **Runtime Context** | Pass user profile to agent on every interaction |
| **Human-in-the-Loop** | User approval before agent actions (e.g., corridor refresh) |

**Generative UI Pattern for Protocol Cards:**
```
Agent returns: { type: "protocol-step", title: "...", warnings: [...], attribution: {...} }
Frontend renders: <ProtocolCard> component from RetroUI library
```

**Architecture Reference:** CopilotKit's [Travel Planner example](https://www.copilotkit.ai/examples) is architecturally similar to TRIBE.

---

### 4.5 Immigrant Resources Reference

**Reference:** `docs/immigrant_resources_api.json`

This JSON file contains a comprehensive catalog of API-accessible and Firecrawl-scrapable resources organized by region:

| Region | Key Sources |
|--------|-------------|
| **USA** | USCIS APIs, Data.gov immigration datasets, r/immigration, r/USCIS |
| **Canada** | IRCC Open Data, Express Entry rounds, Settlement.org, r/ImmigrationCanada |
| **Japan** | e-Stat, GaijinPot, r/movingtojapan, r/japanlife |
| **South Korea** | Korea Immigration Service, HiKorea, r/Living_in_Korea |
| **Europe** | EU Immigration Portal, Make-it-in-Germany, BAMF, Expatica, country-specific |
| **Cross-regional** | World Bank Migration Data, Numbeo, job APIs, Reddit aggregation |

**Implementation notes included:**
- Firecrawl usage best practices and scraping frequency
- Reddit API authentication and rate limits
- Government API registration requirements
- Caching and error handling recommendations

### 4.6 Testing Requirements

**Unit + Integration Testing:**
- Unit tests for utility functions and API clients (Vitest)
- Integration tests for Convex functions
- Component tests for critical UI flows (React Testing Library)
- E2E tests deferred to post-MVP due to timeline

**Manual Testing:**
- Cross-browser testing (Chrome, Safari, Firefox, Edge)
- Mobile responsiveness testing
- Multi-language testing for all 5 MVP languages
- Voice agent testing across languages

### 4.7 Additional Technical Assumptions

- Reddit API access remains available for research ingestion
- Firecrawl can handle JavaScript-rendered forum pages (InterNations, Nairaland)
- ElevenLabs provides acceptable voice quality for Yoruba and Tagalog (needs validation)
- Claude can reliably translate and synthesize in single API call
- Convex free tier sufficient for MVP usage levels
- Vercel free tier sufficient for MVP traffic
- Next.js App Router provides needed i18n support with next-intl
- RetroUI components are compatible with Next.js 14 and Tailwind CSS

---

## 5. Epic List

### Epic 1: Foundation & Core Infrastructure
Establish project setup, authentication, localization, and basic UI scaffold to enable all subsequent development.

### Epic 2: Corridor Intelligence Engine
Build the dynamic corridor research agent and synthesis pipeline that generates sequenced protocols from community sources using Firecrawl, Tavily, and Reddit/YouTube APIs.

### Epic 3: Dashboard & Protocol Experience
Create the corridor dashboard displaying synthesized protocols with attribution, progress tracking, and corridor statistics.

### Epic 4: AI Q&A System
Implement conversational Q&A with RAG retrieval, Claude synthesis, Perplexity fallback, and source attribution.

### Epic 5: Voice & Audio Features
Add audio briefings and conversational voice agent with multi-language support via ElevenLabs.

### Epic 6: Cultural Bridge & Inclusion
Build bi-directional cultural intelligence features that promote understanding between migrants and host communities—cultural profiles, shareable cultural cards, local customs decoder, and belonging tracking.

### Epic 7: Task Board (Kanban)
Create a Trello-style task board that integrates with protocols and journeys, allowing users to track their migration tasks visually with drag-and-drop functionality. Tasks can be created from protocol steps or added manually, with journey-scoped boards and two-way sync between task completion and protocol progress.

### Epic 8: Live Corridor Feed
Build a personalized, real-time feed of corridor-specific migration content from multiple sources (Reddit, YouTube, forums, news, official sources). Uses multi-source intelligence (Reddit's free JSON API, YouTube Data API, Tavily for smart search, Perplexity for policy alerts, and Firecrawl for forums) with AI-powered relevance scoring. Features Gemini-analyzed video content with TL;DR summaries, Threads/Twitter-style UI with infinite scroll, and ability to save items to Document Vault.

### Epic 9: Financial Tracker & Budget Management
Build a comprehensive financial management system for migration expenses with CSV import for bank statements, AI-powered transaction categorization using Gemini, savings goals tracking with progress visualization, real-time multi-currency exchange rates, and corridor-specific budget templates. Critical for hackathon judges evaluating Innovation (AI categorization), Technical Execution (exchange rate integration), and Impact (solving real migrant financial pain).

---

## 6. Epic Details

---

### Epic 1: Foundation & Core Infrastructure

**Goal:** Establish the foundational project infrastructure including Next.js application, Convex backend, Clerk authentication, internationalization, and RetroUI styling. This epic delivers a deployable shell with working auth and localization that all subsequent features build upon.

---

#### Story 1.1: Project Scaffold & Deployment Pipeline

**As a** developer,
**I want** a fully configured Next.js 14 project with Convex, Clerk, and Vercel deployment,
**so that** I have a working foundation to build features upon.

**Acceptance Criteria:**
1. Next.js 14 project initialized with App Router and TypeScript
2. Tailwind CSS configured with RetroUI integration
3. Convex initialized with basic schema and connected to Next.js
4. Environment variables configured for all API keys (Clerk, Convex, etc.)
5. Vercel deployment pipeline working with automatic deploys on main branch
6. Health check route `/api/health` returns 200 OK
7. Project runs locally with `npm run dev`

---

#### Story 1.2: Authentication Flow with Clerk

**As a** user,
**I want** to sign up and log in using email or social accounts,
**so that** my profile and progress are saved across sessions.

**Acceptance Criteria:**
1. Clerk integrated with Next.js middleware protecting authenticated routes
2. Sign up flow with email/password and Google OAuth options
3. Sign in flow with email/password and Google OAuth
4. Sign out functionality accessible from UI
5. User session persisted and accessible in server/client components
6. Unauthenticated users redirected to sign-in page when accessing protected routes
7. Clerk webhook syncs user creation to Convex users table

---

#### Story 1.3: Internationalization Setup with next-intl

**As a** user,
**I want** the app to display in my preferred language,
**so that** I can understand all interface elements without language barriers.

**Acceptance Criteria:**
1. next-intl configured with App Router integration
2. Locale files created for 5 MVP languages: en, yo, hi, pt, tl
3. Language detection from browser preferences on first visit
4. Language switcher component functional in header/settings
5. All static UI strings (buttons, labels, navigation) use translation keys
6. Language preference persisted to user profile in Convex
7. URL structure supports locale prefix (`/en/dashboard`, `/yo/dashboard`)

---

#### Story 1.4: Core Layout & Navigation

**As a** user,
**I want** a consistent navigation structure across all pages,
**so that** I can easily move between features of the app.

**Acceptance Criteria:**
1. App layout with header, main content area, and mobile navigation
2. RetroUI styling applied to all layout components
3. Header displays TRIBE logo, language switcher, and user menu
4. Mobile-responsive hamburger menu for navigation
5. Navigation links to: Dashboard, Q&A, Audio Briefings, Profile
6. Active route highlighted in navigation
7. Footer with minimal branding (optional for MVP)

---

#### Story 1.5: User Profile & Onboarding Data Model

**As a** user,
**I want** to complete onboarding and have my preferences saved,
**so that** the app personalizes content to my specific migration journey.

**Acceptance Criteria:**
1. Convex schema includes users table with: clerkId, language, originCountry, destinationCountry, stage, visaType, createdAt, updatedAt
2. Onboarding flow collects: language (first), origin country, destination country, stage (Planning/Pre-departure/Arrived/Settled), visa type (optional)
3. Onboarding data saved to Convex user profile on completion
4. Returning users skip onboarding and go directly to dashboard
5. Profile settings page allows editing all onboarding fields
6. Corridor derived from origin + destination countries
7. Stage selection includes localized descriptions of each stage

---

### Epic 2: Corridor Intelligence Engine

**Goal:** Build the AI-powered system that researches any migration corridor dynamically using Firecrawl for deep web scraping, Tavily for search, and Reddit/YouTube APIs for community content. Synthesize this into sequenced protocols and cache for fast retrieval.

---

#### Story 2.1: Convex Schema for Corridors & Protocols

**As a** developer,
**I want** a data model for corridors, protocols, and ingested content,
**so that** synthesized intelligence can be stored and retrieved efficiently.

**Acceptance Criteria:**
1. Corridors table with: id, originCountry, destinationCountry, lastResearched, sourceCount, status
2. Protocols table with: id, corridorId, sequence (array of steps), createdAt, updatedAt
3. ProtocolSteps embedded structure with: order, title, description, warnings, hacks, attribution
4. Attribution structure with: authorName, sourceUrl, sourceDate, engagement score
5. IngestedContent table for raw scraped content with: corridorId, sourceUrl, content, scrapedAt
6. Indexes on corridorId and origin+destination for efficient queries
7. TypeScript types generated and exported for frontend use

---

#### Story 2.2: Structured Data API Integration

**As a** system,
**I want** to fetch baseline data from structured APIs,
**so that** protocols include verified visa requirements, costs, and country metadata.

**Acceptance Criteria:**
1. REST Countries API client fetching country metadata (currency, language, timezone)
2. Travel Buddy API client fetching visa requirements for corridor
3. Passport Index dataset loaded into Convex as reference table
4. Numbeo API client fetching cost of living comparison (or fallback to cached data)
5. API responses cached in Convex with TTL of 7 days
6. Error handling with graceful degradation if APIs unavailable
7. TypeScript interfaces for all API response types

---

#### Story 2.3: Mastra Corridor Research Agent with Firecrawl

**As a** system,
**I want** an AI agent that researches any corridor using multiple data sources,
**so that** users get comprehensive intelligence for any corridor dynamically.

**Acceptance Criteria:**
1. Mastra agent configured with corridor research system prompt
2. Agent tools include:
   - `tavilySearch` - Dynamic web search for sources
   - `firecrawlScrape` - Deep scraping of forums, blogs, static pages
   - `redditSearch` - Reddit API for subreddit content
   - `youtubeSearch` - YouTube API for video experiences
   - `perplexityQuery` - Real-time policy/current info
3. Agent accepts origin+destination and returns raw research results
4. Firecrawl configured to scrape: Nairaland, InterNations, Expatica, embassy sites
5. Research results stored in Convex IngestedContent table
6. Agent runs as Convex background action (non-blocking)
7. Agent handles rate limits and retries gracefully

---

#### Story 2.4: Protocol Synthesis Pipeline

**As a** system,
**I want** to synthesize raw research into sequenced protocols,
**so that** users receive actionable, ordered steps rather than raw data.

**Acceptance Criteria:**
1. Claude API integration for synthesis calls
2. Synthesis prompt extracts: tasks, sequence signals, success/failure patterns, warnings, hacks
3. Dependency graph constructed from sequence signals
4. Protocol steps ordered by dependency (topological sort)
5. Best attribution attached to each step (highest engagement + specificity)
6. Synthesized protocol saved to Convex protocols table
7. Synthesis handles multilingual output based on target language parameter

---

#### Story 2.5: Protocol Caching & Freshness

**As a** system,
**I want** to cache protocols and refresh stale data,
**so that** users get fast responses while data stays current.

**Acceptance Criteria:**
1. Protocol retrieval checks cache first before triggering research
2. Protocols older than 30 days flagged as stale
3. Stale protocols trigger background refresh while returning cached data
4. Manual refresh available via admin function (for testing)
5. Protocol status tracked: fresh, stale, refreshing, error
6. Cache hit/miss metrics logged for monitoring

---

### Epic 3: Dashboard & Protocol Experience

**Goal:** Create the user-facing corridor dashboard that displays synthesized protocols with attribution, enables progress tracking, and provides corridor statistics. This is the primary interface where users consume migration intelligence.

---

#### Story 3.1: Corridor Selection & Dashboard Layout

**As a** user,
**I want** to see my corridor dashboard immediately after login,
**so that** I can access my migration intelligence quickly.

**Acceptance Criteria:**
1. Dashboard page loads user's corridor from profile
2. Dashboard header shows corridor (e.g., "Nigeria → Germany")
3. Dashboard displays user's current stage prominently
4. Quick stats section shows: visa type, cost comparison, language
5. Loading state while fetching protocol data
6. Empty state for new corridors being researched
7. RetroUI card-based layout for all dashboard sections

---

#### Story 3.2: Protocol Cards Display

**As a** user,
**I want** to see my arrival protocol as actionable cards,
**so that** I know exactly what to do and in what order.

**Acceptance Criteria:**
1. Protocol steps displayed as vertical sequence of cards
2. Each card shows: step number, title, description, time estimate
3. Cards show warnings highlighted in alert style
4. Cards show hacks/tips highlighted in success style
5. Cards are expandable for full details
6. Card order reflects dependency sequence
7. Current/next step visually emphasized

---

#### Story 3.3: Source Attribution Display

**As a** user,
**I want** to see who provided each piece of advice,
**so that** I can trust the information and verify if needed.

**Acceptance Criteria:**
1. Each protocol card shows attribution: author name, date, source type
2. Attribution links to original source URL (opens in new tab)
3. Engagement indicator shows community validation (upvotes, confirmations)
4. Multiple attributions shown when step has multiple sources
5. "Community verified" badge for high-confidence steps
6. Attribution section collapsible to reduce visual noise

---

#### Story 3.4: Progress Tracking Checklist

**As a** user,
**I want** to mark steps as complete and track my progress,
**so that** I know what I've accomplished and what remains.

**Acceptance Criteria:**
1. Each protocol card has checkbox to mark complete
2. Completion state persisted to user profile in Convex
3. Progress bar shows overall completion percentage
4. Completed steps visually distinct (muted, checkmark)
5. Completion triggers subtle celebration animation
6. Progress survives logout/login (persisted)
7. Reset progress option available in settings

---

#### Story 3.5: Generative UI Protocol Cards

**As a** system,
**I want** protocol cards to be dynamically generated via CopilotKit Generative UI,
**so that** the UI adapts to user context without hardcoding every protocol variation.

**Acceptance Criteria:**
1. Synthesis agent returns structured protocol step objects via AG-UI
2. Frontend receives and renders steps using ProtocolCard components
3. Cards adapt content based on user's current stage (different emphasis for Planning vs Arrived)
4. Warnings and hacks highlighted dynamically based on agent confidence
5. Generative UI uses declarative pattern (agent returns spec, frontend renders)
6. Fallback to static rendering if Generative UI fails
7. Cards maintain RetroUI styling regardless of generation method

---

#### Story 3.6: Corridor Statistics Panel

**As a** user,
**I want** to see key statistics about my corridor,
**so that** I understand the broader context of my migration.

**Acceptance Criteria:**
1. Stats panel shows: visa requirement type, average processing time
2. Cost of living comparison: origin vs destination (rent, food, transport)
3. Currency conversion display (origin → destination)
4. Timezone difference displayed
5. Primary language of destination
6. Stats sourced from structured APIs (Story 2.2)
7. Stats refresh on corridor change

---

### Epic 4: AI Q&A System

**Goal:** Implement conversational Q&A that retrieves relevant community knowledge, synthesizes answers with Claude, falls back to Perplexity for real-time queries, and always provides source attribution.

---

#### Story 4.1: Q&A Chat Interface with CopilotKit

**As a** user,
**I want** a chat interface to ask questions about my migration,
**so that** I can get specific answers beyond the standard protocol.

**Acceptance Criteria:**
1. CopilotKit integrated with Mastra backend (`@copilotkit/react-core`, `@copilotkit/react-ui`, `@ag-ui/mastra`)
2. CopilotChat component configured with custom labels and initial messaging
3. Runtime context passes user corridor, stage, and language to agent
4. Streaming responses render incrementally for better UX
5. Conversation history persisted to Convex per user
6. Bidirectional state sync enables real-time corridor context updates
7. RetroUI theming applied to CopilotKit components

---

#### Story 4.2: RAG Retrieval with Voyage AI

**As a** system,
**I want** to retrieve relevant content for user queries,
**so that** answers are grounded in actual community experiences.

**Acceptance Criteria:**
1. Voyage AI client configured for embedding generation
2. User query embedded and similarity search performed
3. Top 5-10 relevant chunks retrieved from Convex vector store
4. Chunks include metadata: source URL, author, date, engagement
5. Retrieval filtered by user's corridor for relevance
6. Fallback to broader search if corridor-specific results insufficient
7. Retrieval latency <1 second

---

#### Story 4.3: Claude Synthesis for Q&A

**As a** system,
**I want** to synthesize retrieved content into coherent answers,
**so that** users get clear, actionable responses.

**Acceptance Criteria:**
1. Claude API call with retrieved context and user question
2. System prompt instructs: answer in user's language, cite sources, be actionable
3. Response includes synthesized answer with inline citations
4. Response formatted for chat display (markdown supported)
5. Claude handles translation to user's language within same call
6. Token usage logged for cost monitoring
7. Response time <5 seconds including retrieval

---

#### Story 4.4: Perplexity Fallback for Real-time Queries

**As a** system,
**I want** to query Perplexity for real-time or policy questions,
**so that** users get current information not in cached knowledge.

**Acceptance Criteria:**
1. Query classifier detects real-time/policy questions (e.g., "current processing times")
2. Perplexity API called for qualifying queries
3. Perplexity results integrated into Claude synthesis
4. Source attribution includes Perplexity search results
5. Fallback triggers when RAG confidence is low
6. Rate limiting applied to Perplexity calls
7. Perplexity usage logged for cost tracking

---

#### Story 4.5: Q&A Source Attribution

**As a** user,
**I want** every answer to show its sources,
**so that** I can verify information and explore further.

**Acceptance Criteria:**
1. Each Q&A response includes "Sources" section at bottom
2. Sources listed with: title, URL, date, author if available
3. Sources clickable and open in new tab
4. Number of sources cited visible (e.g., "Based on 5 community sources")
5. Perplexity sources distinguished from community sources
6. "This information is from [date]" for freshness transparency
7. Sources displayed in collapsible section to reduce clutter

---

### Epic 5: Voice & Audio Features

**Goal:** Add audio briefings and conversational voice agent with multi-language support, enabling hands-free access to migration intelligence via ElevenLabs TTS/STT.

---

#### Story 5.1: Audio Briefing Generation

**As a** system,
**I want** to generate personalized audio briefing scripts,
**so that** users can listen to their migration updates hands-free.

**Acceptance Criteria:**
1. Briefing script generated based on user's corridor, stage, and progress
2. Script written by Claude in user's selected language
3. Script follows NPR-style format: greeting, key updates, tips, next actions
4. Script length appropriate for briefing type (daily: 2-3 min, weekly: 5-7 min)
5. Script includes mention of attributed sources naturally
6. Scripts cached in Convex with user reference
7. Script regenerated when user profile or progress changes significantly

---

#### Story 5.2: ElevenLabs TTS Integration

**As a** user,
**I want** to listen to my briefing in natural-sounding speech,
**so that** I can consume information while commuting or multitasking.

**Acceptance Criteria:**
1. ElevenLabs API integrated for text-to-speech conversion
2. Voice selected based on user's language preference
3. Audio file generated and stored (Convex file storage or URL)
4. Audio playable via browser audio element
5. Playback controls: play, pause, seek, speed adjustment
6. Audio generation happens in background (non-blocking)
7. Fallback to text display if audio generation fails

---

#### Story 5.3: Audio Briefing Player UI

**As a** user,
**I want** a dedicated player for my audio briefings,
**so that** I have a focused listening experience.

**Acceptance Criteria:**
1. Audio briefing page with prominent player controls
2. Play/pause button, progress bar, time display
3. Playback speed options (0.75x, 1x, 1.25x, 1.5x)
4. Transcript toggle showing briefing text alongside audio
5. "Generate new briefing" button to refresh content
6. Last generated timestamp displayed
7. Player works in background when navigating to other pages

---

#### Story 5.4: Voice Agent STT Input

**As a** user,
**I want** to ask questions using my voice,
**so that** I can interact with TRIBE hands-free.

**Acceptance Criteria:**
1. Voice input button on Q&A interface
2. ElevenLabs STT converts speech to text
3. Push-to-talk interaction model (hold to record)
4. Visual feedback during recording (waveform or indicator)
5. Transcribed text shown before sending
6. User can edit transcription before submitting
7. Voice input works in user's selected language

---

#### Story 5.5: Voice Agent TTS Response

**As a** user,
**I want** to hear answers spoken back to me,
**so that** I can have a fully hands-free conversation.

**Acceptance Criteria:**
1. Q&A responses optionally spoken via ElevenLabs TTS
2. "Listen" button on each response to trigger TTS
3. Auto-speak toggle in settings for hands-free mode
4. Voice response uses same voice as audio briefings (consistency)
5. Response speaks in user's selected language
6. Speaking indicator shows when audio is playing
7. Interrupt capability to stop playback

---

### Epic 6: Cultural Bridge & Inclusion

**Goal:** Create bi-directional cultural intelligence features that help migrants understand local culture AND help locals understand migrant cultures. This epic positions TRIBE as a cultural bridge-builder, not just a migration helper—promoting genuine inclusion and community belonging.

**Key Innovation:** Most migration apps treat inclusion as one-directional ("help migrants adapt"). TRIBE's Cultural Bridge is bi-directional—it creates shareable artifacts that educate host communities about migrant cultures, fostering mutual understanding.

---

#### Story 6.2: Cultural Profile Builder

**As a** user,
**I want** to complete an AI-guided cultural interview,
**so that** TRIBE deeply understands my cultural background and can provide personalized insights.

**Acceptance Criteria:**
1. AI-guided interview flow with 8-12 contextual questions
2. Questions cover: communication style, values, family structure, social norms, food/dietary, celebrations, conflict resolution, time orientation
3. Claude generates follow-up questions based on answers (adaptive interview)
4. Cultural profile stored in Convex with structured data
5. Profile summary displayed on user's dashboard
6. Option to edit/update profile answers
7. Profile data used to personalize cultural insights throughout app

---

#### Story 6.3: Shareable Cultural Cards

**As a** user,
**I want** to generate cultural cards explaining my culture to others,
**so that** I can help my neighbors, coworkers, and community understand my background.

**Acceptance Criteria:**
1. Generate button on cultural profile page
2. Claude synthesizes cultural profile into shareable card content
3. Card includes: greeting customs, communication tips, food traditions, important holidays, "what to know" summary
4. Cards rendered as beautiful, printable/shareable graphics
5. Share via link, download as PDF, or copy text
6. Multiple card variants: "For Neighbors", "For Coworkers", "For Schools"
7. Cards available in user's language AND destination country language

---

#### Story 6.4: Local Customs Decoder

**As a** user,
**I want** to understand local customs with context and "why",
**so that** I can navigate daily situations without cultural misunderstandings.

**Acceptance Criteria:**
1. Searchable database of local customs for destination country
2. Each custom includes: description, context/history, "why" explanation, tips for migrants
3. AI generates custom explanations based on user's origin culture (comparative framing)
4. Categories: workplace, social, dining, relationships, public behavior, holidays
5. "Did you know?" notifications with relevant customs based on user's stage
6. Examples include both dos and don'ts with recovery phrases
7. Content sourced from community experiences with attribution

---

#### Story 6.5: Cultural Micro-Moments

**As a** user,
**I want** real-time cultural tips for daily situations,
**so that** I can navigate awkward moments and build confidence.

**Acceptance Criteria:**
1. AI assistant provides contextual cultural tips on demand
2. "Decode this situation" feature in Q&A chat
3. Tips include: explanation of what happened, why it happened, how to respond
4. Common scenarios: cold greetings, different work styles, social invitations, small talk norms
5. Tips personalized to user's origin→destination corridor
6. Examples of similar situations from community experiences
7. Option to save helpful tips for future reference

---

#### Story 6.6: Belonging Dashboard

**As a** user,
**I want** to track my integration journey with milestones,
**so that** I can see my progress and stay motivated.

**Acceptance Criteria:**
1. Dashboard section showing "Belonging Score" (0-100)
2. Score calculated from completed milestones across categories
3. Categories: Social connections, Cultural experiences, Local knowledge, Community involvement
4. Milestone examples: "Made first local friend", "Attended local festival", "Joined community group"
5. Self-reported milestone completion with optional notes
6. Celebration animations for milestone achievements
7. Suggestions for next milestones based on current progress

---

#### Story 6.7: Cultural Exchange Matcher (Future)

**As a** user,
**I want** to connect with local cultural buddies,
**so that** I have someone to ask questions and share experiences with.

**Acceptance Criteria:**
1. Opt-in program for locals who want to be cultural buddies
2. Matching based on: location, interests, profession, family status
3. AI-suggested conversation starters based on cultural profiles
4. In-app messaging or contact sharing (user choice)
5. Feedback/rating system for safety and quality
6. Cultural buddy recognition/gamification (badges, thank-you notes)
7. Privacy controls for what profile info is shared

*Note: This story is marked for future implementation beyond MVP due to additional safety/moderation requirements.*

---

### Epic 7: Task Board (Kanban)

**Goal:** Create a visual task management system that integrates with the existing protocol system, allowing users to track their migration tasks using a familiar Trello-style Kanban board. Tasks can originate from protocol steps or be created manually, providing a personal action-oriented view of the migration journey.

**Key Innovation:** Unlike generic to-do apps, TRIBE's Task Board is journey-aware and protocol-integrated. Protocol steps serve as AI-generated reference guides, while tasks represent the user's personal action items. This separation allows users to maintain their own workflow while still benefiting from the structured guidance protocols provide.

---

#### Story 7.1: Task Board Data Model & Backend

**As a** developer,
**I want** a data model for tasks that integrates with journeys and protocols,
**so that** tasks can be tracked per journey with optional protocol step references.

**Acceptance Criteria:**
1. Tasks table with: id, corridorId, title, description, status, priority, dueDate, protocolStepId (optional), order, column
2. Column enum: "todo", "in_progress", "blocked", "done"
3. Tasks indexed by corridorId for efficient journey-scoped queries
4. Tasks indexed by status for column filtering
5. Optional reference to protocol step (protocolStepId) for tasks derived from protocols
6. Order field for drag-and-drop positioning within columns
7. TypeScript types generated and exported for frontend use

---

#### Story 7.2: Task Board UI Component

**As a** user,
**I want** a Kanban-style task board on my dashboard,
**so that** I can visually track my migration tasks across different stages.

**Acceptance Criteria:**
1. Four-column board layout: To Do, In Progress, Blocked, Done
2. Each column displays task cards with title, priority indicator, and due date
3. RetroUI/neobrutalist styling consistent with existing dashboard
4. Responsive design: columns stack on mobile, side-by-side on desktop
5. Empty state for each column with helpful messaging
6. Column headers show task count
7. Board is journey-scoped (shows tasks for active corridor only)

---

#### Story 7.3: Drag-and-Drop Task Management

**As a** user,
**I want** to drag tasks between columns,
**so that** I can easily update task status with a natural interaction.

**Acceptance Criteria:**
1. Drag-and-drop implemented using @dnd-kit/core (shadcn-kanban pattern)
2. Visual feedback during drag (card lifts, drop zone highlights)
3. Task status updates in Convex when dropped in new column
4. Optimistic UI update for smooth experience
5. Reordering within columns supported
6. Touch-friendly for mobile users
7. Keyboard accessibility for drag operations (a11y)

---

#### Story 7.4: Add Task from Protocol Step

**As a** user,
**I want** to add protocol steps to my task board,
**so that** I can turn AI-generated guidance into personal action items.

**Acceptance Criteria:**
1. "Add to Board" button on each protocol step card
2. Creates task with title and description from protocol step
3. Task links to source protocol step (protocolStepId)
4. Default status: "todo", priority inherited from protocol priority
5. Prevents duplicate tasks for same protocol step (shows "Already on board" badge)
6. Protocol card shows indicator when step has associated task
7. Clicking indicator navigates to task on board

---

#### Story 7.5: Create Custom Task

**As a** user,
**I want** to create custom tasks not tied to protocols,
**so that** I can track personal migration tasks that aren't covered by AI guidance.

**Acceptance Criteria:**
1. "Add Task" button in each column header or floating action button
2. Quick-add form with title (required), description (optional), priority, due date
3. Task created in selected column or defaults to "todo"
4. Custom tasks have no protocolStepId (null)
5. Category selector matching protocol categories (visa, finance, housing, etc.)
6. Keyboard shortcut for quick task creation (Cmd/Ctrl + N)
7. Cancel and save buttons with proper states

---

#### Story 7.6: Two-Way Protocol-Task Sync

**As a** user,
**I want** task completion to sync with protocol progress,
**so that** completing a task marks the related protocol step as done and vice versa.

**Acceptance Criteria:**
1. Moving task to "Done" column marks linked protocol step as completed
2. Marking protocol step complete moves linked task to "Done" column
3. Sync is bidirectional and real-time (Convex reactivity)
4. Completion triggers celebration animation on both task and protocol
5. Tasks without protocol links don't affect protocol progress
6. Un-completing (moving out of Done) un-marks protocol step
7. Sync operations are atomic (both update or neither)

---

#### Story 7.7: Task Board Filters and Views

**As a** user,
**I want** to filter and customize my task board view,
**so that** I can focus on specific categories or priorities.

**Acceptance Criteria:**
1. Filter by category (visa, finance, housing, employment, legal, health, social)
2. Filter by priority (critical, high, medium, low)
3. Filter by due date (overdue, today, this week, upcoming, no date)
4. Toggle to show/hide completed tasks
5. Filter state persisted in URL for shareable links
6. Clear all filters button
7. Active filter indicators visible

---

#### Story 7.8: Task Details Modal

**As a** user,
**I want** to view and edit task details,
**so that** I can add notes, change priority, or update due dates.

**Acceptance Criteria:**
1. Click task card opens detail modal/drawer
2. Edit title, description, priority, due date, category
3. View linked protocol step (if any) with link to full protocol
4. Add notes/comments to task
5. Delete task with confirmation
6. Created/updated timestamps displayed
7. Close modal saves changes (auto-save or explicit save button)

---

#### Story 7.9: Task Board Journey Switching

**As a** user,
**I want** my task board to update when I switch journeys,
**so that** I see tasks relevant to my current migration corridor.

**Acceptance Criteria:**
1. Task board automatically filters to active corridor
2. Journey switcher in header updates board instantly
3. Each journey has independent task board state
4. Switching journeys preserves filter selections
5. Empty state when switching to journey with no tasks
6. Task count per journey shown in journey switcher dropdown
7. No task data bleeds between journeys

---

### Epic 8: Live Corridor Feed

**Goal:** Build a personalized, real-time migration intelligence feed that aggregates content from multiple sources (Reddit, YouTube, expat forums, news, official sources) filtered specifically for the user's corridor. Uses AI to analyze video content, smart relevance scoring, and enables saving useful items to the Document Vault.

**Key Innovation:** Unlike generic migration news feeds, TRIBE's Live Corridor Feed is hyper-personalized to the user's specific origin→destination journey with AI-enhanced content (Gemini video summaries), multi-source aggregation, and journey-stage awareness.

---

#### Story 8.1: Feed Data Model & Caching

**As a** developer,
**I want** a data model for feed items with caching and quota management,
**so that** feed content can be stored efficiently and API costs are controlled.

**Acceptance Criteria:**
1. CorridorFeed table with: id, origin, destination, source (reddit/youtube/forum/news/official), type, title, snippet, url, timestamp, thumbnail, upvotes, comments, isAlert, alertType
2. SavedFeedItems table with: id, userId, corridorId, feedItem (embedded), category, userNotes, savedAt, updatedAt
3. YouTubeQuotaUsage table tracking daily quota consumption with automatic reset
4. VideoAnalysisCache table with: videoId, transcript, aiSummary, keyTimestamps, youllLearn, cachedAt (7-day TTL)
5. Indexes on origin+destination and timestamp for efficient feed queries
6. TypeScript types generated for all feed schemas
7. Convex queries for: getCorridorFeed, needsRefresh, getCorridorStats

---

#### Story 8.2: Reddit Integration via Free JSON API

**As a** system,
**I want** to fetch corridor-specific posts from Reddit without authentication,
**so that** the feed includes real community discussions and experiences.

**Acceptance Criteria:**
1. Reddit client fetches from `/r/{subreddit}/new.json` endpoint (no auth needed)
2. Fetches from country-specific subreddits (e.g., r/japan, r/germany) for destination
3. Fetches from global migration subreddits (r/IWantOut, r/expats) and filters by destination mention
4. Alert detection for keywords: "slots opened", "scam", "warning", "policy change"
5. Rate limiting with 300ms delay between requests
6. Handles Reddit API errors gracefully with fallback to cached data
7. Posts stored with upvotes, comments, author attribution

---

#### Story 8.2.5: AI-Powered Relevance Analysis

**As a** system,
**I want** to use Gemini AI to analyze feed items for true relevance to user's corridor and journey stage,
**so that** users only see content that's genuinely useful for their specific migration path (not just keyword matches).

**Acceptance Criteria:**
1. Gemini 2.0 Flash analyzes batches of 10 feed items per request for cost efficiency
2. AI assigns relevance score (0-100) based on corridor match, migration focus, and actionability
3. AI assigns stage score (0-100) matching user's journey stage (researching, applying, approved, arrived)
4. AI detects alerts intelligently (not keyword-based) and assigns type (opportunity, warning, update)
5. Items with relevance score < 50 are filtered out (not shown to user)
6. Analysis includes 1-sentence reason explaining the score for debugging
7. Batch analysis processes all sources (Reddit, forums, news) before saving to feed
8. Results cached with feed items to avoid re-analysis on subsequent requests
9. Analysis respects Gemini free tier (1,500 requests/day = 15,000 posts/day analyzed)
10. Graceful fallback to keyword-based filtering if Gemini unavailable

**Example Analysis:**

```json
{
  "postIndex": 0,
  "relevanceScore": 92,
  "stageScore": 85,
  "isAlert": true,
  "alertType": "opportunity",
  "reason": "Specific work visa slots opened for tech workers in Japan - highly actionable for planning stage"
}
```

**Why This Story Is Critical:**
- Current keyword matching shows "Japan Airlines office in Germany" (irrelevant) ❌
- Current keyword matching misses "Tokyo work visa timeline" (no "Japan" keyword) ❌
- AI understands context, intent, and true relevance ✅

---

#### Story 8.3: YouTube Integration with Data API v3

**As a** system,
**I want** to fetch corridor-specific migration videos,
**so that** users can learn from visual experiences and guides.

**Acceptance Criteria:**
1. YouTube Data API v3 client with API key authentication
2. Search queries: "{destination} immigration", "{destination} moving vlog", "{destination} visa guide"
3. Quota management system tracks daily usage (10K units limit)
4. Search costs 100 units; quota checked before each call
5. Results cached for 24 hours to reduce API calls
6. Prioritizes high-traffic corridors when quota is low
7. Fallback to cached videos when quota exhausted

---

#### Story 8.4: Gemini Video Transcript Analysis

**As a** system,
**I want** to analyze YouTube video transcripts using Gemini AI,
**so that** users get TL;DR summaries and key timestamps without watching full videos.

**Acceptance Criteria:**
1. youtube-transcript npm package extracts transcripts from video IDs
2. Gemini 2.0 Flash analyzes transcript (free tier: 1,500 requests/day)
3. AI generates: 2-3 sentence TL;DR, 3 key timestamps with topics, "You'll learn:" sentence
4. Analysis returned as structured JSON for frontend rendering
5. Results cached in VideoAnalysisCache table for 7 days
6. Handles videos without transcripts gracefully (skip analysis)
7. Analysis prompt optimized for migration content extraction

---

#### Story 8.5: Tavily Smart Search Integration

**As a** system,
**I want** to use Tavily API for intelligent resource discovery,
**so that** the feed includes high-quality articles and guides not found via standard scraping.

**Acceptance Criteria:**
1. Tavily API client with API key authentication
2. Advanced search mode with domain filtering (official sites, trusted resources)
3. Search queries personalized to corridor and user's journey stage
4. Results include: title, snippet, URL, published date, domain
5. Deduplication with existing feed items (URL matching)
6. Rate limiting to stay within free tier (1K credits/month = ~125 searches)
7. Cost tracking logs usage for monitoring

---

#### Story 8.6: Perplexity API for Policy Alerts

**As a** system,
**I want** to query Perplexity for real-time policy changes and official announcements,
**so that** users get time-sensitive updates about their corridor.

**Acceptance Criteria:**
1. Perplexity Search API client with API key authentication
2. Time filtering set to "daily" or "weekly" for recent updates
3. Domain filtering prioritizes government/official sources
4. Query: "{destination} immigration policy changes {current_date}"
5. Results flagged as "Alert" type with "update" or "warning" badge
6. Rate limiting: max 5 queries per corridor per day ($5/1K requests budget)
7. Results deduplicated and merged into main feed

---

#### Story 8.7: Firecrawl Forum Scraping

**As a** system,
**I want** to scrape expat forum discussions using Firecrawl,
**so that** the feed includes community wisdom from specialized forums.

**Acceptance Criteria:**
1. Firecrawl API client configured with API key
2. Scrapes forums from migration_app_complete.json where scrapable=true
3. Uses markdown format with onlyMainContent=true for clean extraction
4. Filters forum posts mentioning destination country or migration keywords
5. Limit to 1 forum per corridor to control costs ($16/month budget)
6. Handles forums that require JavaScript rendering (waitFor: 2000ms)
7. Forum posts limited to 5 per feed to prevent dominance

---

#### Story 8.8: Relevance Scoring Algorithm

**As a** system,
**I want** to rank feed items by relevance to user's corridor and journey,
**so that** the most useful content appears first.

**Acceptance Criteria:**
1. Scoring algorithm considers: destination mention (required), recency (max 10 points), source credibility (official: 15, youtube: 8, reddit: 7, forum: 5), alert priority (opportunity: 20, warning: 18, update: 12), engagement (upvotes/comments), journey stage keywords match
2. Items without destination mention automatically scored 0 and filtered out
3. Stage relevance: "researching"→guides, "applying"→docs, "approved"→housing, "arrived"→settling
4. Source diversification prevents monotony (no more than 3 consecutive items from same source)
5. Alert items always boosted to top regardless of other scores
6. Scoring function returns numeric score 0-100
7. Feed sorted by score descending before display

---

#### Story 8.9: Threads/Twitter-Style Feed UI

**As a** user,
**I want** a modern, engaging feed interface,
**so that** consuming migration content feels familiar and enjoyable.

**Acceptance Criteria:**
1. Infinite scroll implementation (loads more items as user scrolls)
2. Feed item cards with: source badge, title, snippet, inline thumbnail (videos), engagement metrics (upvotes, comments), timestamp ("2h ago")
3. Alert items highlighted with colored badges and pulsing animation
4. Video items show thumbnail, duration, and AI-generated TL;DR inline
5. Click expands full item details in modal (or navigates to external link)
6. RetroUI styling with bold borders, chunky buttons, high contrast
7. Mobile-optimized touch targets and responsive layout

---

#### Story 8.10: Save to Document Vault

**As a** user,
**I want** to save useful feed items to my Document Vault,
**so that** I can reference them later during my migration journey.

**Acceptance Criteria:**
1. "Save" button on each feed item (bookmark icon)
2. Save modal with: category selector (Visa, Housing, Jobs, Finance, Health, Legal, Culture, General), notes field (optional), corridor auto-populated
3. Saved items stored in SavedFeedItems table with userId reference
4. Saved items accessible from Document Vault with new "Saved Feed Items" tab
5. Prevent duplicate saves (show "Already saved" badge if item saved)
6. Saved items grouped by category in vault
7. Option to edit notes or delete saved items from vault

---

#### Story 8.11: Feed Refresh & Caching Strategy

**As a** system,
**I want** to cache feed content and refresh intelligently,
**so that** users get fast load times while data stays current.

**Acceptance Criteria:**
1. Feed cached in Convex CorridorFeed table per corridor
2. Cache considered fresh for 6 hours
3. After 6 hours, background refresh triggered while showing cached data
4. Manual refresh button available for users (force refresh)
5. Refresh fetches from all sources in parallel (Reddit, YouTube, Tavily, Perplexity)
6. Deduplicate by URL before saving to cache
7. Refresh status indicator shows last update time

---

#### Story 8.12: Feed Personalization by Journey Stage

**As a** user,
**I want** feed content tailored to my current migration stage,
**so that** I see information relevant to where I am in my journey.

**Acceptance Criteria:**
1. Feed query accepts user's current stage (researching, applying, approved, arrived)
2. Content filtered/boosted based on stage keywords
3. Stage-specific content categories emphasized (researching→guides, applying→requirements, approved→housing/jobs, arrived→settling tips)
4. Stage preference stored in user profile
5. Stage switcher in feed header to preview other stages
6. Feed adapts in real-time when user updates stage in profile
7. Empty state messages personalized by stage ("No visa updates yet - we're watching for you")

---

#### Story 8.13: Feed Analytics & Monitoring

**As a** system,
**I want** to track feed performance and API usage,
**so that** costs stay within budget and users get relevant content.

**Acceptance Criteria:**
1. Track API usage daily: YouTube quota, Tavily credits, Perplexity requests, Firecrawl scrapes
2. Log relevance score distribution to validate algorithm effectiveness
3. Track user engagement: save rate, click-through rate, time spent on feed
4. Alert when approaching quota limits (90% of daily cap)
5. Cost tracking dashboard showing spend per API per month
6. A/B testing capability for relevance algorithm tweaks
7. Error logging for API failures with automatic retries

---

### Epic 9: Financial Tracker & Budget Management

**Goal:** Build a comprehensive financial management system that helps migrants track their migration expenses, manage budgets across multiple currencies, import bank statements with AI categorization, set and track savings goals, and access real-time exchange rates. This epic is critical for the VisaVerse hackathon, demonstrating Innovation (AI-powered categorization), Technical Execution (multi-currency support, API integration), and Impact (solving the #1 migrant pain point: managing money during transition).

---

#### Story 9.1: Financial Data Model & Exchange Rate Integration

**As a** developer,
**I want** database schema for budgets, expenses, savings goals, and exchange rates,
**so that** financial tracking is performant and supports multi-currency workflows.

**Acceptance Criteria:**
1. FinancialBudgets table with: userId, corridorId, originCurrency, destinationCurrency, totalBudgetOrigin, totalBudgetDestination, createdExchangeRate, allocations (6 categories), createdAt, updatedAt
2. FinancialExpenses table with: userId, corridorId, budgetId, name, category (6 types), amountPaid, currency, exchangeRate, amountInDestination, status (paid/pending/planned), datePaid, dateDue, notes, receiptUrl
3. SavingsGoals table with: userId, corridorId, budgetId, name, description, targetAmount, currentAmount, currency, targetDate, milestones array, status (active/completed/paused), completedAt
4. CurrencyRates table with: fromCurrency, toCurrency, rate, source, timestamp
5. Exchange rate API client with dual provider support (exchangeratesapi.io primary, exchangerate-api.com fallback)
6. Daily cron job updating 22 major currency pairs at 8 AM UTC
7. Exchange rate API route `/api/exchange-rate` for real-time queries

---

#### Story 9.2: Budget Creation Wizard with Corridor Templates

**As a** user,
**I want** a guided wizard to create my migration budget,
**so that** I can set realistic financial goals based on my corridor.

**Acceptance Criteria:**
1. Wizard triggered when user has no budget for their active corridor
2. Step 1: Display typical budget for corridor (e.g., "Nigeria → Canada: ~$8,500 CAD")
3. Step 2: User enters total budget in origin OR destination currency (auto-converts using real-time exchange rate)
4. Step 3: Suggest allocations across 6 categories based on corridor research: Visa & Immigration (30%), Tests (15%), Travel (20%), Settlement (25%), Financial Services (5%), Miscellaneous (5%)
5. Step 4: User can customize allocation percentages (must total 100%)
6. Step 5: Review & confirm - shows budget summary with all allocations
7. Budget saved to Convex with current exchange rate locked in
8. Wizard uses RetroUI neobrutalist styling with bold visuals

---

#### Story 9.3: Expense Tracking Dashboard

**As a** user,
**I want** to see my migration budget progress and recent expenses,
**so that** I stay on track financially.

**Acceptance Criteria:**
1. Financial tracker page `/finances` in main navigation (DollarSign icon)
2. Budget overview card showing: total spent vs total budget, progress bar (green <90%, yellow 90-110%, red >110%)
3. Status indicator badge: "on-track", "over-budget", or "under-budget"
4. Remaining budget displayed prominently in destination currency
5. Category breakdown showing spent/allocated for each of 6 categories
6. Upcoming expenses section (next 30 days) with due dates countdown
7. Recent expenses list (last 10) with date, category, amount, status
8. "Add Expense" button opens modal for manual entry
9. Real-time updates when expenses added (Convex reactivity)

---

#### Story 9.4: Manual Expense Entry

**As a** user,
**I want** to manually add migration expenses,
**so that** I can track spending as it happens.

**Acceptance Criteria:**
1. Add Expense modal with form fields: name (required), category selector (6 options), amount (required), currency (defaults to destination), status (paid/pending/planned)
2. Optional fields: date paid, date due, notes, receipt upload (future)
3. Real-time exchange rate fetched if currency differs from destination
4. Amount automatically converted to destination currency for budget tracking
5. Expense saved to Convex with exchange rate locked in
6. Modal closes and expense appears immediately in dashboard
7. Success feedback with subtle animation
8. Form validation with helpful error messages

---

#### Story 9.5: CSV Import for Bank Statements

**As a** user,
**I want** to upload my bank statement CSV,
**so that** I can import many transactions at once instead of manual entry.

**Acceptance Criteria:**
1. "Import Transactions" button on finances page opens CSV upload modal
2. File upload accepts .csv and .xlsx formats (max 5MB)
3. Parser detects common bank statement formats (date, description, amount columns)
4. Preview table shows first 10 parsed transactions before import
5. Column mapping UI if parser uncertain (user maps: date → column A, amount → column B)
6. "Analyze & Import" triggers AI categorization
7. Upload progress indicator with current transaction count
8. Error handling for malformed CSV with clear user guidance

---

#### Story 9.6: Gemini AI Transaction Categorization

**As a** system,
**I want** to use Gemini AI to categorize imported transactions,
**so that** users don't manually categorize hundreds of expenses.

**Acceptance Criteria:**
1. Batch analysis processes 10 transactions per Gemini API call for efficiency
2. AI analyzes transaction description and amount to determine category
3. Categories: Visa & Immigration, Tests, Travel, Settlement, Financial Services, Miscellaneous
4. AI assigns confidence score (0-100) to each categorization
5. Low confidence (<70) flagged for user review with suggested category
6. Bulk import mutation saves all categorized expenses to Convex
7. Deduplication by date+amount to prevent duplicate imports
8. Import summary shows: X imported, Y duplicates skipped, Z need review
9. Categorization stays within Gemini free tier (1,500 requests/day = 15,000 transactions/day)

---

#### Story 9.7: Savings Goals Tracker

**As a** user,
**I want** to set and track savings goals for my migration,
**so that** I stay motivated and financially prepared.

**Acceptance Criteria:**
1. "Savings Goals" section on finances page
2. "Add Goal" button opens creation modal
3. Goal form: name (required), description (optional), target amount (required), target date (optional)
4. Milestone suggestions: 25%, 50%, 75%, 100% with custom milestone option
5. Goal card shows: name, progress bar, current/target amounts, percentage complete
6. Manual "Add Savings" button to increment current amount
7. Milestone achievement celebration animation
8. Goal status: active (in progress), completed (target reached), paused (user paused)
9. Multiple goals supported per corridor

---

#### Story 9.8: Multi-Currency Display

**As a** user,
**I want** to see amounts in both origin and destination currencies,
**so that** I understand costs in familiar terms.

**Acceptance Criteria:**
1. All expense amounts show destination currency primarily
2. Hover/tap shows origin currency equivalent with exchange rate
3. Budget summary shows total in both currencies
4. Exchange rate watermark: "1 CAD = 287.65 NGN (as of Dec 29)"
5. Toggle switch to flip primary/secondary currency display
6. Currency preference persisted to user profile
7. Historical exchange rate shown for past expenses (rate at time of payment)

---

#### Story 9.9: Budget Analytics & Insights

**As a** user,
**I want** AI-generated insights about my spending,
**so that** I can make smarter financial decisions.

**Acceptance Criteria:**
1. "Insights" card on dashboard with 2-3 bullet points
2. Spending pace analysis: "You're spending $X/day, on track to reach budget in Y days"
3. Category alerts: "Visa expenses are 120% of allocation - consider adjusting budget"
4. Savings recommendations: "Exchange rate favorable now - good time to transfer funds"
5. Upcoming expense warnings: "$500 due in 3 days - ensure funds available"
6. Insights update daily using Claude synthesis
7. Insights clickable to see detailed explanation

---

#### Story 9.10: Enhanced Audio Briefing Script Generation

**As a** system,
**I want** to generate hyper-personalized audio briefing scripts using 10 data sources,
**so that** briefings are deeply relevant to each user's journey.

**Acceptance Criteria:**
1. Daily briefing generator queries 10 sources: user todos, saved documents, feed alerts (from Story 8.x), Perplexity API (policy news, job market trends, cultural insights, destination news), corridor statistics, financial summary (from Story 9.3), community wisdom
2. Claude synthesis combines all sources into cohesive 2-3 minute script
3. Script structure: personalized greeting with name/corridor, urgent actions (top 3 todos, feed alerts), progress summary (completed tasks this week), new opportunities (jobs, policy changes), financial check-in (budget status, upcoming expenses), today's focus (recommended next step), motivational close
4. Script generated in user's selected language (independent of app UI language)
5. Script cached for 24 hours unless user profile changes significantly
6. Generation completes in <30 seconds (NFR24)

---

#### Story 9.11: Weekly Briefing with Deep Insights

**As a** system,
**I want** to generate comprehensive weekly briefings,
**so that** users get strategic migration insights beyond daily updates.

**Acceptance Criteria:**
1. Weekly briefing generated every Sunday at 6 AM user's timezone
2. Script structure (5-7 min): week review (accomplishments, setbacks, time spent on migration tasks), corridor intelligence update (policy changes, new resources, community trends), financial deep dive (spending analysis, savings progress, exchange rate recommendations), community insights (success stories, common mistakes, helpful tips), roadmap for next week (prioritized actions, deadlines), comparative analysis (progress vs typical timeline for corridor), celebration of milestones with encouragement
3. Perplexity queries for week's policy changes and news
4. Financial deep dive includes category spending breakdown and trend analysis
5. Community insights sourced from feed items saved by user + high-engagement Reddit posts
6. Roadmap generated by Claude based on user's current stage and protocol steps
7. Script personalized to user's language and cultural communication style

---

#### Story 9.12: Actionable Briefing UI with Inline Buttons

**As a** user,
**I want** briefing player with actionable buttons,
**so that** I can act on insights without leaving the audio experience.

**Acceptance Criteria:**
1. Audio player shows briefing sections as expandable transcript while playing
2. Each section has inline action buttons based on content type
3. Urgent actions section: "Add to Todos" button (creates todo item)
4. Opportunities section: "Save to Vault" button (saves referenced feed item)
5. Financial check-in: "View Budget" button (navigates to finances page)
6. Community insights: "View Source" button (opens original Reddit/YouTube link)
7. "Ask TRIBE" quick-chat button for follow-up questions on any section
8. Buttons context-aware: only show relevant actions per section
9. Actions execute without stopping audio playback

---

#### Story 9.13: AI-Powered Visa Pathway Discovery

**As a** user,
**I want** the AI to suggest visa alternatives and compare pathways conversationally,
**so that** I discover migration options I didn't know existed.

**Acceptance Criteria:**
1. VisaRequirements table in Convex with: origin, destination, visaType, processingTime, difficulty, requirements, stayDuration, visaStatus, governmentLink, lastUpdated
2. Data sourced from Travel Buddy API (primary - /v2/visa/map for multi-destination, /v2/visa/check for details, /v2/passport/rank/custom for difficulty), supplemented with Perplexity API for policy updates and cached processing times database
3. Weekly cron job refreshes visa data for active corridors using Travel Buddy API free tier (120 requests/month)
4. AI chat tool `searchVisaOptions` with parameters: originCountry, destinationCountry (optional), visaType (optional)
5. Tool returns top 10 visa pathways ranked by: ease of qualification, processing time, success rate, current policy favorability
6. AI formats results conversationally with comparison cards showing: destination, visa type, processing time, key requirements, difficulty score (easy/moderate/hard)
7. Proactive suggestions during onboarding: "You also qualify for Portugal, UK, UAE - want to track alternatives?"
8. Corridor dashboard shows subtle "Explore Alternatives" tip that opens chat with pre-filled question
9. Weekly briefing includes visa intelligence: "Portugal extended tech visa timeline to 90 days" with source attribution
10. Chat can answer questions like: "Is Germany easier than Canada for me?", "What countries don't need visa from Nigeria?", "Show me tech visa options"
11. Results include actionable next steps: "Add Germany as alternative corridor?", "View Portugal requirements", "Compare processing times"
12. Visa policy updates appear in feed with alert badge when relevant to user's corridor

**Key Innovation:**
- No separate visa search UI (keeps dashboard clean)
- Conversational discovery via AI chat (judges love this)
- Proactive intelligence in briefings (shows data integration depth)
- Strategic positioning: TRIBE doesn't just guide one path, it helps find the BEST path

**Demo Script for Judges:**
```
User: "What visa options do I have from Nigeria?"
AI: "Based on your Nigerian passport, here are your strongest pathways:
     🇵🇹 Portugal - Tech Visa (3-6 months, moderate)
     🇦🇪 UAE - Golden Visa (fast, investor focus)
     🇨🇦 Canada - Express Entry (6-12 months, competitive)

     Portugal might be easier for tech workers right now. Want details?"
```

---

## 7. Checklist Results Report

*To be completed after PRD review and before development begins.*

Run PM checklist to validate:
- [ ] All functional requirements traceable to stories
- [ ] All non-functional requirements addressed in architecture
- [ ] Epic sequencing is logical and deliverable
- [ ] Story sizing appropriate for AI agent execution
- [ ] No circular dependencies between stories
- [ ] Acceptance criteria are testable and unambiguous
- [ ] Firecrawl integration properly scoped in Story 2.3

---

## 8. Next Steps

### 8.1 UX Expert Prompt

> Review the TRIBE PRD at `docs/prd.md`, focusing on Section 3 (UI Design Goals) and the story acceptance criteria for user-facing features. Create a detailed Frontend Specification using the front-end-spec template that defines the visual design system, component library usage (RetroUI), screen layouts, interaction patterns, and responsive breakpoints. Pay special attention to the multi-language requirements and the neobrutalist aesthetic direction.

### 8.2 Architect Prompt

> Review the TRIBE PRD at `docs/prd.md`, focusing on Section 4 (Technical Assumptions) and all epic/story details. Create a comprehensive Architecture Document using the fullstack-architecture template that defines the system architecture, Convex schema design, API integration patterns (including Firecrawl for web scraping), Mastra agent configuration, AI pipeline design (RAG, synthesis, translation), and deployment architecture. Ensure the architecture supports the 2-week hackathon timeline with appropriate trade-offs.

---

*Generated by John (Product Manager) using BMad Method*
