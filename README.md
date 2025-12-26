# TRIBE - The Diaspora Intelligence Network

**AI-powered migration guidance for the global diaspora**

TRIBE is an intelligent migration assistant that helps people navigate the complex journey of moving to a new country. By aggregating real experiences from diaspora communities and transforming them into actionable, step-by-step protocols, TRIBE provides personalized guidance throughout every stage of migration.

## The Problem

Moving to a new country is overwhelming. Migrants face:

- **Information overload**: Scattered advice across Reddit, forums, government sites, and blogs
- **Outdated guidance**: Immigration policies change constantly
- **Generic advice**: One-size-fits-all information that doesn't account for specific corridors (e.g., Nigeria to Germany vs. Philippines to Canada)
- **Language barriers**: Critical information often only available in the destination country's language
- **Stage-specific needs**: Someone just dreaming about moving needs different help than someone actively relocating

## The Solution

TRIBE creates personalized **Migration Protocols** - curated, prioritized action items based on:

- Your origin and destination countries (migration corridor)
- Your current stage in the journey (Dreaming, Planning, Preparing, Relocating, Settling)
- Real experiences from people who've made the same journey
- Up-to-date official requirements and regulations

## Features

### Core Features

- **Migration Protocols**: AI-generated step-by-step guides organized by category (Visa, Finance, Housing, Employment, Legal, Health, Social)
- **Stage-Based Journey**: Progress through 5 migration stages with protocols that adapt as you advance
- **Protocol Archive**: Automatic archiving when you change stages, preserving your journey history
- **Save for Later**: Bookmark important protocols with personal notes for future reference
- **Migration Corridor Intelligence**: Specific guidance for your exact origin-destination pair

### AI-Powered Assistance

- **Ask TRIBE Chat**: Natural language Q&A about immigration, visas, and cultural adaptation
- **Voice Chat**: Multilingual voice conversations powered by Google Gemini Live API
- **Smart Tools**: Generate document checklists, get step-by-step breakdowns, search government sources
- **Contextual Understanding**: AI that knows your corridor, stage, and progress

### Personalization

- **9 Languages Supported**: English, Yoruba, Hindi, Portuguese, Tagalog, Korean, German, French, Spanish
- **Cultural Profiles**: AI-guided interview to understand your cultural background
- **Auto-Speak**: Optional text-to-speech for AI responses in your language

### Progress Tracking

- **Journey Stats**: Overall completion rate across all stages
- **Active/Archived/Saved Views**: Different perspectives on your protocols
- **Protocol Status**: Track not started, in progress, completed, or blocked items

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with neobrutalist design
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon system
- **Mapbox GL** - Interactive corridor maps

### Backend & Database
- **Convex** - Real-time backend with reactive queries
- **Clerk** - Authentication and user management

### AI & ML
- **CopilotKit** - AI chat interface with tool calling
- **Google Gemini** - LLM for chat and voice (gemini-2.5-flash)
- **Gemini Live API** - Real-time voice conversations
- **Mastra** - AI agent orchestration
- **Tavily** - Web search for real-time information
- **Firecrawl** - Web scraping for content ingestion

### Internationalization
- **next-intl** - Full i18n support with 9 locales

## Project Structure

```
apps/web/
├── app/
│   └── [locale]/
│       ├── (dashboard)/
│       │   ├── chat/          # Ask TRIBE chat interface
│       │   ├── dashboard/     # Main protocol dashboard
│       │   └── briefing/      # Audio briefings
│       ├── onboarding/        # User onboarding flow
│       ├── settings/          # User settings
│       └── page.tsx           # Landing page
├── components/
│   ├── chat/                  # Chat and voice components
│   ├── dashboard/             # Dashboard widgets
│   ├── landing/               # Landing page sections
│   ├── layout/                # Header, Footer, Navigation
│   ├── onboarding/            # Country/Stage selectors
│   └── protocol/              # Protocol cards, tabs, archive views
├── convex/                    # Convex backend functions
│   ├── schema.ts              # Database schema
│   ├── protocols.ts           # Protocol CRUD
│   ├── protocolArchive.ts     # Archive & save functionality
│   ├── corridors.ts           # Corridor management
│   └── users.ts               # User management
├── lib/
│   ├── constants/             # Countries, stages, coordinates
│   └── utils/                 # Utility functions
└── messages/                  # i18n translation files
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Convex account
- Clerk account
- Google AI API key

### Environment Variables

Create a `.env.local` file:

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your-key

# Mapbox (optional, for corridor maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk...

# Tavily (for web search)
TAVILY_API_KEY=tvly-...
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tribe-ai.git
cd tribe-ai

# Install dependencies
pnpm install

# Start Convex development server
npx convex dev

# Start Next.js development server (in another terminal)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deployment

The app is configured for deployment on Vercel:

```bash
# Deploy to Vercel
npx vercel --prod

# Deploy Convex to production
npx convex deploy
```

## Migration Stages

TRIBE guides users through 5 stages:

| Stage | Description |
|-------|-------------|
| **Dreaming** | Exploring the possibility of moving abroad |
| **Planning** | Researching destinations and requirements |
| **Preparing** | Gathering documents and making arrangements |
| **Relocating** | Actively in the process of moving |
| **Settling** | Adapting to life in the new country |

## Protocol Categories

Protocols are organized into 7 categories:

| Category | Icon | Description |
|----------|------|-------------|
| Visa | 🛂 | Immigration and visa requirements |
| Finance | 💰 | Banking, money transfers, taxes |
| Housing | 🏠 | Finding and securing accommodation |
| Employment | 💼 | Job search, work permits |
| Legal | ⚖️ | Legal requirements and rights |
| Health | 🏥 | Healthcare and insurance |
| Social | 👥 | Community and cultural adaptation |

## Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the VisaVerse AI Hackathon
- Inspired by the millions of migrants navigating their journeys every day
- Powered by the amazing open-source community

---

**TRIBE** - *Real advice from real migrants, organized into protocols you can actually follow.*
