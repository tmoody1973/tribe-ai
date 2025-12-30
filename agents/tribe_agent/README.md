# TRIBE ADK Agent

Migration assistance agent powered by Google Gemini via ADK (Agent Development Kit).

## Overview

This agent provides the AI backend for TRIBE's chat functionality. It uses:
- **Google ADK**: Agent framework with Gemini models
- **AG-UI Protocol**: Standard protocol for frontend-agent communication
- **FastAPI**: HTTP server with SSE streaming
- **CopilotKit**: Frontend integration via `@ag-ui/adk`

## Quick Start

### 1. Set up Python environment

```bash
cd agents/tribe_agent

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your GEMINI_API_KEY
```

### 3. Run the server

```bash
# Development (with auto-reload)
python server.py

# Or using uvicorn directly
uvicorn server:app --reload --port 8000
```

### 4. Verify it's running

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API information |
| `GET /health` | Health check for monitoring |
| `POST /agui` | AG-UI protocol endpoint (SSE) |
| `GET /docs` | OpenAPI documentation |

## Architecture

```
┌─────────────────────┐     AG-UI/SSE      ┌─────────────────────┐
│   Next.js Frontend  │ ◄─────────────────► │   ADK Agent Server  │
│   (CopilotKit)      │                     │   (FastAPI)         │
└─────────────────────┘                     └─────────────────────┘
                                                      │
                                                      ▼
                                            ┌─────────────────────┐
                                            │   Google Gemini     │
                                            │   (gemini-2.5-flash)│
                                            └─────────────────────┘
```

## Development

### Running tests

```bash
pytest
```

### Linting

```bash
ruff check .
ruff format .
```

### Adding new tools

Tools are defined in `tools/` directory. See `agent.py` for how to register them.

```python
from google.adk.tools import FunctionTool

@FunctionTool
async def my_tool(param: str) -> dict:
    """Tool description."""
    return {"result": param}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CONVEX_SITE_URL` | Yes | Convex backend URL |
| `HOST` | No | Server host (default: 0.0.0.0) |
| `PORT` | No | Server port (default: 8000) |
| `ENVIRONMENT` | No | development/production |
| `LOG_LEVEL` | No | Logging level (default: INFO) |

## Frontend Integration

The Next.js frontend connects via CopilotKit:

```typescript
// apps/web/app/api/copilotkit/route.ts
import { CopilotRuntime, ExperimentalEmptyAdapter } from "@copilotkit/runtime";
import { ADKAgent } from "@ag-ui/adk";

const runtime = new CopilotRuntime({
  agents: {
    tribe_agent: new ADKAgent({
      url: process.env.ADK_AGENT_URL || "http://localhost:8000/agui",
    }),
  },
});
```

## Deployment

See Story 10.11 for production deployment to Google Cloud Run.
