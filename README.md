# TRIBE - The Diaspora Intelligence Network

**AI-powered migration guidance for the global diaspora**

TRIBE is an intelligent migration assistant that helps people navigate the complex journey of moving to a new country. By aggregating real experiences from diaspora communities and transforming them into actionable, step-by-step protocols, TRIBE provides personalized guidance throughout every stage of migration.

## The Problem

Moving to a new country is overwhelming. Migrants face:

- **Information overload**: Scattered advice across Reddit, forums, government sites, and blogs
- **Outdated guidance**: Immigration policies change constantly
- **Generic advice**: One-size-fits-all information that doesn't account for specific corridors (e.g., Nigeria to Germany vs. Philippines to Canada)
- **Language barriers**: Critical information often only available in the destination country's language
- **Cultural shock**: No preparation for the cultural differences they'll encounter
- **Stage-specific needs**: Someone just dreaming about moving needs different help than someone actively relocating

## The Solution

TRIBE creates personalized **Migration Protocols** - curated, prioritized action items based on:

- Your origin and destination countries (migration corridor)
- Your current stage in the journey (Dreaming, Planning, Preparing, Relocating, Settling)
- Your cultural background and values
- Real experiences from people who've made the same journey
- Up-to-date official requirements and regulations

## Features

### Core Features

- **Migration Protocols**: AI-generated step-by-step guides organized by category (Visa, Finance, Housing, Employment, Legal, Health, Social)
- **Multi-Journey Support**: Track up to 5 different migration corridors simultaneously (e.g., planning moves to both Germany and Canada)
- **Stage-Based Journey**: Progress through 5 migration stages with protocols that adapt as you advance
- **Protocol Archive**: Automatic archiving when you change stages, preserving your journey history
- **Save for Later**: Bookmark important protocols with personal notes for future reference
- **Protocol Refresh**: Force-refresh protocols when your destination changes to get updated guidance

### AI-Powered Assistance

- **Ask TRIBE Chat**: Natural language Q&A about immigration, visas, and cultural adaptation
- **Voice Chat**: Multilingual voice conversations powered by Google Gemini Live API
- **AI Step Assistant**: Get detailed AI-powered walkthroughs for any protocol step
- **Smart Tools**: Generate document checklists, get step-by-step breakdowns, search government sources
- **Cultural Decoder**: AI explains cultural misunderstandings from both perspectives
- **Contextual Understanding**: AI that knows your corridor, stage, cultural profile, and progress

### Cultural Intelligence

- **Cultural Interview**: AI-guided 10-question interview during onboarding to understand your background
- **Cultural Profile**: Captures communication style, family structure, time orientation, values, and traditions
- **Cultural Bridge**: AI-powered comparison showing cultural dimensions between origin and destination
- **Culturally-Aware Chat**: All AI responses tailored to your cultural context

### Document Management

- **Document Vault**: Secure storage for all your migration documents
- **Smart Categories**: Organize by type (Passport, Visa, Identity, Education, Employment, Financial, Medical, Legal)
- **Expiry Tracking**: Set expiry dates and get alerts for documents that need renewal
- **Quick Access**: Search, filter, preview, and download documents

### Dashboard Widgets

- **Journey Map**: Interactive Mapbox visualization of your migration corridor
- **Journey Switcher**: Easily switch between multiple migration journeys
- **Quick Stats**: Visa requirements, language, currency, and timezone at a glance
- **Visa Eligibility Quiz**: AI-powered assessment of your visa options
- **True Cost Calculator**: Compare cost of living between origin and destination
- **Salary Reality Check**: Understand what salaries really mean in your destination
- **First 48 Hours Guide**: Critical tasks for your first days after arrival
- **Emergency Info Card**: Important contacts and resources for emergencies
- **Country Info Card**: Key facts about your destination country

### Personalization

- **9 Languages Supported**: English, Yoruba, Hindi, Portuguese, Tagalog, Korean, German, French, Spanish
- **Auto-Speak**: Optional text-to-speech for AI responses in your language

### Progress Tracking

- **Journey Stats**: Overall completion rate across all stages
- **Active/Archived/Saved Views**: Different perspectives on your protocols
- **Protocol Status**: Track not started, in progress, completed, or blocked items
- **Multi-Journey Progress**: See completion percentage for each journey

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with neobrutalist design
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon system
- **Mapbox GL** - Interactive corridor maps

### Backend & Database
- **Convex** - Real-time backend with reactive queries and file storage
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
│   ├── [locale]/
│   │   ├── (dashboard)/
│   │   │   ├── chat/              # Ask TRIBE chat interface
│   │   │   ├── dashboard/         # Main protocol dashboard
│   │   │   ├── settings/          # User settings
│   │   │   └── cultural/          # Cultural profile page
│   │   ├── onboarding/            # User onboarding flow (5 steps)
│   │   └── page.tsx               # Landing page
│   └── api/
│       ├── chat/                  # CopilotKit chat endpoint
│       ├── voice/                 # Gemini Live voice API
│       ├── cultural-bridge/       # Cultural comparison API
│       └── step-assistant/        # Protocol step AI assistant
├── components/
│   ├── chat/                      # Chat and voice components
│   ├── corridor/                  # Corridor header, stats
│   ├── cultural/                  # Cultural profile components
│   ├── dashboard/                 # Dashboard widgets
│   ├── documents/                 # Document vault
│   ├── landing/                   # Landing page sections
│   ├── layout/                    # Header, Footer, Navigation
│   ├── onboarding/                # Country/Stage/Cultural selectors
│   └── protocol/                  # Protocol cards, tabs, archive views
├── convex/                        # Convex backend functions
│   ├── schema.ts                  # Database schema
│   ├── protocols.ts               # Protocol CRUD
│   ├── protocolArchive.ts         # Archive & save functionality
│   ├── corridors.ts               # Multi-journey management
│   ├── users.ts                   # User management
│   ├── userDocuments.ts           # Document vault storage
│   └── cultural/                  # Cultural profile & interview
├── hooks/                         # Custom React hooks
│   └── useMigrationTools.tsx      # CopilotKit tool definitions
├── lib/
│   ├── constants/                 # Countries, stages, coordinates
│   └── utils/                     # Utility functions
└── messages/                      # i18n translation files (9 locales)
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

# Mapbox (for corridor maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk...

# Tavily (for web search)
TAVILY_API_KEY=tvly-...
```

### Installation

```bash
# Clone the repository
git clone https://github.com/tmoody1973/tribe-ai.git
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
# Deploy Convex to production
npx convex deploy

# Deploy to Vercel
npx vercel --prod
```

## User Journey

### Onboarding (5 Steps)

1. **Origin Country** - Where are you from?
2. **Destination Country** - Where are you going?
3. **Migration Stage** - What stage are you at?
4. **Visa Type** (optional) - What visa are you pursuing?
5. **Cultural Profile** (optional) - AI-guided interview about your background

### Migration Stages

| Stage | Description |
|-------|-------------|
| **Dreaming** | Exploring the possibility of moving abroad |
| **Planning** | Researching destinations and requirements |
| **Preparing** | Gathering documents and making arrangements |
| **Relocating** | Actively in the process of moving |
| **Settling** | Adapting to life in the new country |

### Protocol Categories

| Category | Icon | Description |
|----------|------|-------------|
| Visa | 🛂 | Immigration and visa requirements |
| Finance | 💰 | Banking, money transfers, taxes |
| Housing | 🏠 | Finding and securing accommodation |
| Employment | 💼 | Job search, work permits |
| Legal | ⚖️ | Legal requirements and rights |
| Health | 🏥 | Healthcare and insurance |
| Social | 👥 | Community and cultural adaptation |

## Recent Updates

### v1.2.0 - Cultural Intelligence & Multi-Journey
- Added Cultural Interview to onboarding (AI-guided 10 questions)
- Cultural Bridge showing origin↔destination cultural dimensions
- Multi-Journey support (track up to 5 corridors)
- Journey Switcher dropdown for easy switching
- Document Vault for secure document storage
- Protocol force-refresh when destination changes

### v1.1.0 - Dashboard Widgets
- Journey Map with Mapbox visualization
- Visa Eligibility Quiz
- True Cost Calculator
- Salary Reality Check
- First 48 Hours Guide
- Emergency Info Card
- AI Step Assistant for protocol walkthroughs

### v1.0.0 - Initial Release
- Migration Protocols with AI research
- Stage-based journey progression
- Ask TRIBE chat with voice support
- 9-language support
- Protocol archive and save functionality

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

[Live Demo](https://tribe-ai.vercel.app) | [GitHub](https://github.com/tmoody1973/tribe-ai)
