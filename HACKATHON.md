# TRIBE - The Diaspora Intelligence Network

## VisaVerse AI Hackathon Submission

**Track:** Machine Learning/AI
**Tagline:** "Immigration tools help you file paperwork. TRIBE helps you belong."

---

## Problem Statement

280+ million people migrate globally each year. Existing immigration tools focus on paperwork and checklists, but migration is fundamentally a **human experience** involving:

- Cultural adaptation and identity
- Understanding unwritten social norms
- Building belonging in a new country
- Navigating complex, ever-changing visa requirements

**TRIBE solves this by providing cultural intelligence, not just bureaucratic checklists.**

---

## Solution Overview

TRIBE is an AI-powered cultural intelligence platform that:

1. **Learns your cultural background** through an AI-guided interview
2. **Researches your specific corridor** (origin → destination) using real-time web data
3. **Generates personalized protocols** - actionable steps tailored to your situation
4. **Provides cultural bridge analysis** - understanding how your culture translates to your destination
5. **Offers voice-enabled guidance** - multilingual AI assistant for hands-free help

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  Next.js 15 (App Router) + TypeScript + Tailwind CSS            │
│  Neo-brutalist UI Design                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Gemini    │  │  Perplexity │  │   Tavily    │              │
│  │  2.0 Flash  │  │    Sonar    │  │   Search    │              │
│  │             │  │             │  │             │              │
│  │ • Cultural  │  │ • Real-time │  │ • News &    │              │
│  │   Interview │  │   research  │  │   updates   │              │
│  │ • Voice     │  │ • Source    │  │ • Policy    │              │
│  │   Chat      │  │   synthesis │  │   changes   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend                                      │
│  Convex (Real-time Database + Serverless Functions)             │
│  • Protocol storage & status tracking                            │
│  • Cultural profile management                                   │
│  • Research content caching (30-day TTL)                        │
│  • Vector embeddings for RAG                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  External APIs                                   │
│  • Mapbox GL JS (Interactive maps)                              │
│  • TravelTables (Cost of living data)                           │
│  • Clerk (Authentication)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI/ML Integration

### 1. Cultural Intelligence Engine (Gemini 2.0 Flash)

**Purpose:** Understand the user's cultural background through conversational AI

**Implementation:**
- Multi-turn interview flow with contextual questions
- Extracts: communication style, family structure, time orientation, values
- Generates shareable cultural identity cards

```typescript
// Cultural interview generates structured profile
{
  originCulture: "Nigerian Yoruba",
  communicationStyle: "indirect",
  familyStructure: "extended",
  timeOrientation: "polychronic",
  values: ["family", "respect for elders", "community"]
}
```

### 2. Research Pipeline (Perplexity Sonar + Tavily)

**Purpose:** Real-time research on migration corridors

**Implementation:**
- Perplexity Sonar searches Reddit, forums, government sites
- Tavily enriches with recent news and policy updates
- Content stored with vector embeddings for RAG retrieval
- 30-day caching with automatic refresh

```typescript
// Research sources
- r/IWantOut, r/expats, r/immigration
- Official embassy and visa portals
- ExpatForum, InterNations
- Immigration news and policy updates
```

### 3. Protocol Synthesis (Gemini + Custom Agent)

**Purpose:** Generate personalized action items from research

**Implementation:**
- Custom Mastra agent with structured output
- Dependency graph for logical ordering
- Attribution tracking to original sources
- Stage-aware generation (dreaming → settling)

### 4. Cultural Bridge Analysis (Gemini 2.0 Flash)

**Purpose:** Compare origin and destination cultures

**Implementation:**
- Hofstede cultural dimensions analysis
- Visual compatibility scoring (0-100%)
- Practical adaptation tips
- Leverages user's cultural profile for personalization

### 5. Voice Assistant (Gemini Live API)

**Purpose:** Hands-free, multilingual guidance

**Implementation:**
- Real-time WebSocket streaming
- Supports 9 languages
- Context-aware responses based on user's corridor

---

## Key Features

### Cultural Interview
AI-guided conversation that builds a cultural profile, understanding not just where you're from, but who you are culturally.

### Smart Protocols
Personalized action items generated from real research, not generic checklists. Each protocol includes:
- Step-by-step guidance
- Insider tips ("hacks") from the diaspora community
- Warnings about common pitfalls
- Source attribution

### Cultural Bridge
Visual comparison showing how your culture translates to your destination, with specific adaptation tips for each dimension.

### Live Research Streaming
Visible AI research process showing sources being searched and insights being extracted in real-time.

### Country Intelligence
Detailed destination guides with:
- Interactive Mapbox maps with city markers
- Cost of living metrics
- Visa options and requirements
- Community insights

### Voice Walkthrough
Multilingual voice chat for hands-free guidance, powered by Gemini Live API.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| UI Components | Custom Neo-brutalist design system |
| Database | Convex (real-time, serverless) |
| Authentication | Clerk |
| AI - Cultural | Google Gemini 2.0 Flash |
| AI - Research | Perplexity Sonar API |
| AI - Search | Tavily API |
| AI - Voice | Gemini Live API (WebSocket) |
| Maps | Mapbox GL JS |
| Cost Data | TravelTables (RapidAPI) |
| Hosting | Vercel |
| i18n | next-intl (9 languages) |

---

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Korean (ko)
- Hindi (hi)
- Tagalog (tl)
- Yoruba (yo)

---

## Impact & Relevance

### Global Challenge Addressed
- 280M+ international migrants globally
- $656B in remittances (2022)
- Migration is a defining challenge of our era

### Why TRIBE Matters
1. **Cultural intelligence over bureaucracy** - Helps people adapt, not just comply
2. **Real-time, researched guidance** - Not static content, but live intelligence
3. **Personalized to your journey** - Origin + destination + stage = unique protocols
4. **Community wisdom preserved** - Captures diaspora knowledge that would otherwise be lost

### Target Users
- Skilled workers relocating internationally
- Students studying abroad
- Family reunification migrants
- Digital nomads and remote workers

---

## Demo Flow

1. **Onboarding** - Select origin, destination, migration stage
2. **Cultural Interview** - AI-guided conversation (2-3 minutes)
3. **Dashboard** - See personalized protocols with live research
4. **Cultural Bridge** - Understand culture gap with adaptation tips
5. **Country Guide** - Explore destination with maps and data
6. **Voice Chat** - Ask questions in your language

---

## Running Locally

```bash
# Clone repository
git clone https://github.com/tmoody1973/tribe-ai.git
cd tribe-ai

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Add your API keys:
# - GOOGLE_AI_API_KEY (Gemini)
# - PERPLEXITY_API_KEY
# - TAVILY_API_KEY
# - NEXT_PUBLIC_MAPBOX_TOKEN
# - Clerk keys
# - Convex deployment URL

# Start Convex backend
npx convex dev

# Start Next.js frontend
pnpm dev
```

---

## Team

**Tarik Moody** - Full Stack Developer & AI Engineer

---

## Links

- **Live Demo:** https://tribe-ai.vercel.app
- **GitHub:** https://github.com/tmoody1973/tribe-ai
- **Video Demo:** [Coming Soon]

---

## Future Roadmap

1. **B2B Enterprise Dashboard** - For companies relocating employees
2. **Immigration Attorney Integration** - Seamless legal handoff
3. **Community Features** - Connect with others on similar journeys
4. **Mobile App** - React Native for on-the-go guidance
5. **More Corridors** - Expand researched country pairs

---

*Built with love for the diaspora community*
