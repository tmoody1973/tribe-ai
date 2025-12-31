# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a new project using the **BMad Method** - an AI-driven agile planning and development framework. The `.bmad-core/` directory contains the method's agents, tasks, templates, and configuration.

## BMad Method Agents

Invoke agents via slash commands (e.g., `/BMad:agents:dev`). Key agents:

| Agent | Purpose |
|-------|---------|
| `/analyst` | Research, brainstorming, market analysis, project brief creation |
| `/pm` | PRD creation with FRs, NFRs, epics, and stories |
| `/architect` | System architecture design |
| `/po` | Document validation, sharding, alignment checks |
| `/sm` | Story drafting from epics (`*draft` command) |
| `/dev` | Story implementation (`*develop-story {story}` command) |
| `/qa` | Test architecture, quality gates, risk assessment |
| `/ux-expert` | Frontend specs and UI prompts |
| `/bmad-master` | Meta-agent that can perform any agent task except implementation |

## QA Commands

The QA agent (Test Architect "Quinn") uses these commands:

- `*risk` / `*risk-profile` - Risk assessment before development
- `*design` / `*test-design` - Test strategy creation
- `*trace` / `*trace-requirements` - Requirements-to-test coverage mapping
- `*nfr` / `*nfr-assess` - Non-functional requirements validation
- `*review` - Full quality gate assessment (required after development)
- `*gate` - Update quality gate status

## Standard Project Paths

```
docs/prd.md           → Product Requirements Document
docs/architecture.md  → Architecture document
docs/prd/             → Sharded PRD (epic files)
docs/architecture/    → Sharded architecture sections
docs/stories/         → Story files
docs/qa/assessments/  → QA assessment outputs
docs/qa/gates/        → Quality gate decision files
.ai/debug-log.md      → Dev debug log
```

## Configuration

`.bmad-core/core-config.yaml` defines:
- `devLoadAlwaysFiles`: Architecture docs the dev agent always loads
- `devStoryLocation`: Where stories are stored (`docs/stories`)
- Document sharding settings

## Development Workflow

1. **SM**: Draft story with `*draft` → Review → Approve
2. **QA (optional)**: `*risk`, `*design` before dev starts
3. **Dev**: `*develop-story {story}` → Implement tasks
4. **QA (optional mid-dev)**: `*trace`, `*nfr` for early validation
5. **QA (required)**: `*review` for quality gate
6. **Commit**: After QA passes

## Brownfield Projects

For existing codebases, use the architect's `*document-project` task to generate contextual artifacts before adding features. See `.bmad-core/working-in-the-brownfield.md`.

## AI Models

This project uses Google Gemini models via Google ADK (Agent Development Kit).

| Use Case | Model ID | Location |
|----------|----------|----------|
| Chat (ADK Agent) | `gemini-2.5-flash` | `agents/tribe_agent/` |
| Mastra Agents | `google/gemini-2.5-flash` | N/A |
| Voice/Live API | `gemini-2.0-flash-live-preview-04-09` | N/A |

**Important:**
- Chat is handled by Google ADK agent (Python/FastAPI), NOT in-process JavaScript
- Do NOT use `gemini-3-flash-preview` - it has "thinking mode" that causes parsing issues
- CopilotKit uses `ExperimentalEmptyAdapter` since LLM is external
- ADK agent communicates via AG-UI protocol over SSE

## Chat Architecture

```
┌─────────────────────┐     AG-UI/SSE      ┌─────────────────────┐
│   Next.js Frontend  │ ◄─────────────────► │   ADK Agent Server  │
│   (CopilotKit)      │                     │   (FastAPI/Python)  │
└─────────────────────┘                     └─────────────────────┘
         │                                           │
         │ /api/copilotkit                          │
         └──────────────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │   Google Gemini     │
                │   (gemini-2.5-flash)│
                └─────────────────────┘
```

### Key Files

- `apps/web/app/api/copilotkit/route.ts` - CopilotKit endpoint, connects to ADK agent
- `apps/web/components/providers/CopilotProvider.tsx` - CopilotKit configuration
- `apps/web/hooks/useADKToolRenderers.tsx` - Renders ADK agent tool results
- `apps/web/hooks/useFrontendTools.tsx` - Frontend tools (navigation, modals)
- `apps/web/hooks/useHITLHandler.tsx` - Human-in-the-loop approval handlers
- `agents/tribe_agent/` - Python ADK agent backend

### Running the ADK Agent

```bash
# Development
cd agents/tribe_agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python server.py

# Production (Google Cloud Run)
cd agents/tribe_agent
gcloud builds submit --config=cloudbuild.yaml
```

### Environment Variables

Frontend (`.env.local`):
```
ADK_AGENT_URL=http://localhost:8000/agui  # Local dev
# ADK_AGENT_URL=https://your-cloud-run-url/agui  # Production
```

ADK Agent (`.env`):
```
GEMINI_API_KEY=your_key
CONVEX_SITE_URL=https://your-deployment.convex.site
```

## Testing

E2E tests use Playwright:

```bash
cd apps/web
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:performance  # Run performance tests only
```
