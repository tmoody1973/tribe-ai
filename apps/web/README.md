# TRIBE - Diaspora Intelligence Network

AI-powered migration intelligence for diaspora communities.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + RetroUI (neobrutalist design)
- **Database**: Convex (real-time backend)
- **Authentication**: Clerk
- **Language**: TypeScript

## Getting Started

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Configure Convex

Initialize Convex and get your deployment URL:

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex
- Create a new project (or link to existing)
- Generate the `NEXT_PUBLIC_CONVEX_URL` value

Add the URL to your `.env.local` file.

### 3. Configure Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your API keys to `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 4. Run Development Server

Start both Next.js and Convex:

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Next.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |

## Project Structure

```
app/
├── layout.tsx      # Root layout with providers
├── page.tsx        # Landing page
├── globals.css     # Tailwind + RetroUI styles
└── providers.tsx   # Convex provider

components/
└── retroui/        # RetroUI components

convex/
├── schema.ts       # Database schema
└── health.ts       # Health check query
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
