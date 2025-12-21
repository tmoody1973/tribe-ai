# ✅ VERIFIED API STACK FOR PATHFINDER

## 🛂 Visa & Immigration Data APIs

| API | Description | Pricing | Documentation |
| :---- | :---- | :---- | :---- |
| **Travel Buddy API** | Visa requirements, stay duration, passport validity, eVisa links for 194 countries | Free tier (120 req/mo), Paid from $4.99/mo | [travel-buddy.ai/api](https://travel-buddy.ai/api/) |
| **Passport Visa API** (GitHub) | Open-source API built on passport-index-dataset, free hosted version | **Free** | [github.com/nickypangers/passport-visa-api](https://github.com/nickypangers/passport-visa-api) |
| **Visa Checker API** (Zyla Hub) | Visa status, requirements by passport/destination | Free (2 calls), Paid tiers | [zylalabs.com](https://zylalabs.com/api-marketplace/travel/visa+checker+api/2154) |
| **Sherpa API** | Visa requirements \+ health declarations \+ travel advisories | Contact for pricing | [docs.joinsherpa.io](http://docs.joinsherpa.io/) |
| **VisaDB.io** | Visa requirements, safety info, health risks, customs | Contact for pricing | [visadb.io/api](https://visadb.io/api) |
| **DJB Visas API** | Detailed visa requirements, processing times, embassy info, required documents | Contact for pricing | [api.djbvisas.com](https://api.djbvisas.com/api-docs/visa-requirements-api/) |

## 📊 Open Source Datasets (Load into Convex)

| Dataset | Description | Format | Link |
| :---- | :---- | :---- | :---- |
| **Passport Index Dataset** | Visa requirements matrix for 199 countries, updated regularly | CSV (ISO-2, ISO-3, tidy) | [github.com/ilyankou/passport-index-dataset](https://github.com/ilyankou/passport-index-dataset) |
| **Henley Passport Index Dataset** | Historical passport strength data \+ visa-free counts | CSV | [github.com/alsonpr/Henley-Passport-Index-Dataset](https://github.com/alsonpr/Henley-Passport-Index-Dataset) |

## 💰 Cost of Living & Economic Data

| API | Description | Pricing | Link |
| :---- | :---- | :---- | :---- |
| **Numbeo API** | Cost of living, rent, crime, healthcare quality for 12,500+ cities | Paid (contact [api@numbeo.com](mailto:api@numbeo.com)) | [numbeo.com/api](https://www.numbeo.com/api/doc.jsp) |
| **World Bank API** | Economic indicators, GDP, employment data | **Free** | [data.worldbank.org](https://data.worldbank.org) |
| **REST Countries** | Country metadata, flags, languages, currencies | **Free** | [restcountries.com](https://restcountries.com) |
| **Open Exchange Rates** | Currency conversion | Free tier available | [openexchangerates.org](https://openexchangerates.org) |

## 🎓 Credential Verification (For "Proof" concept)

| API | Description | Pricing |
| :---- | :---- | :---- |
| **Certn API** | Education verification (US, Canada) | Contact |
| **MeasureOne** | 98% coverage US/Canada colleges, document parsing | Contact |
| **Qualification Check API** | 50,000+ institutions in 195 countries | Contact |
| **Parchment Digitary** | International credential verification | Enterprise |

## 🤖 AI Layer

| Service | Purpose | Pricing |
| :---- | :---- | :---- |
| **Anthropic Claude API** (Sonnet 4\) | Pathway analysis, document review, reasoning | Pay-per-token |
| **ElevenLabs** | Audio briefings (your specialty\!) | Free tier \+ paid |
| **Tavily API** | Real-time web search for policy changes | Free tier |
| **Voyage AI** | Embeddings for semantic search | Free tier |

## 🌍 Location & Mapping

| API | Description | Pricing |
| :---- | :---- | :---- |
| **OpenCage Geocoding** | Location lookup | Free tier (2,500/day) |
| **Mapbox** | Interactive pathway visualization | Free tier |
| **Nominatim** | OpenStreetMap geocoding | **Free** |

---

COMMUNITY DATA SOURCES ├── Reddit API (free for research) │ └── r/IWantOut, r/expats, r/immigration, country subs ├── InterNations public forums ├── Expatica articles

# 📦 COMPLETE TECH STACK

```
FRONTEND
├── Next.js 14 (App Router)
├── Tailwind CSS
├── shadcn/ui
├── React Flow (pathway visualization)
└── Framer Motion (animations)

BACKEND/DATABASE
├── Convex (real-time DB + serverless functions)
├── Clerk (authentication)
└── Upstash (rate limiting, caching)

AI SERVICES
├── Claude API (Sonnet 4) - pathway reasoning
├── ElevenLabs - audio briefings
├── Tavily - policy monitoring
└── Voyage AI - embeddings

DATA SOURCES
├── Travel Buddy API (primary visa data)
├── Passport Index Dataset (CSV → Convex)
├── REST Countries (country metadata)
├── Numbeo API (cost of living)
└── World Bank API (economic indicators)

INFRASTRUCTURE
├── Vercel (deployment)
├── Resend (email notifications)
├── Stripe (subscriptions)
├── Sentry (error monitoring)
└── PostHog (analytics)
```

---

# 🚀 QUICK START DATA STRATEGY

Since you're non-technical, here's the **simplest approach**:

### Option A: Use Free/Open APIs Only (MVP)

```
1. Passport Index Dataset → Download CSV → Import to Convex
2. Travel Buddy API → Free tier (120 requests/month)
3. REST Countries API → Free
4. World Bank API → Free
5. Claude API → Pay as you go
```

### Option B: Hybrid (Demo-Ready)

```
Add:
- Numbeo API (demo key)
- OpenCage geocoding (2,500 free/day)
- ElevenLabs (free tier for audio)
```

---

Want me to scaffold the project with these verified APIs, or should we refine the data architecture first?  
