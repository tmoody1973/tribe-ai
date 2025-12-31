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
| `ADDITIONAL_CORS_ORIGINS` | No | Extra CORS origins (comma-separated) |

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

### Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and configured
- Cloud Run API enabled
- Container Registry API enabled

### Option 1: Automated Deployment with Cloud Build

1. **Create secrets in Google Secret Manager:**

```bash
# Create API key secret
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Create Convex URL secret
echo -n "https://your-deployment.convex.site" | gcloud secrets create convex-site-url --data-file=-
```

2. **Deploy using Cloud Build:**

```bash
cd agents/tribe_agent
gcloud builds submit --config=cloudbuild.yaml
```

3. **Get the deployed URL:**

```bash
gcloud run services describe tribe-agent --region=us-central1 --format='value(status.url)'
```

4. **Update Vercel environment:**

Add `ADK_AGENT_URL` to your Vercel project settings with the Cloud Run URL.

### Option 2: Manual Docker Deployment

1. **Build the Docker image:**

```bash
cd agents/tribe_agent
docker build -t tribe-agent .
```

2. **Test locally:**

```bash
docker run -p 8000:8000 --env-file .env tribe-agent
```

3. **Push to Container Registry:**

```bash
docker tag tribe-agent gcr.io/YOUR_PROJECT_ID/tribe-agent
docker push gcr.io/YOUR_PROJECT_ID/tribe-agent
```

4. **Deploy to Cloud Run:**

```bash
gcloud run deploy tribe-agent \
  --image gcr.io/YOUR_PROJECT_ID/tribe-agent \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest,CONVEX_SITE_URL=convex-site-url:latest"
```

### Performance Expectations

| Metric | Target | Notes |
|--------|--------|-------|
| Cold start | <5s | First request after idle |
| Warm response | <2s | Subsequent requests |
| Memory | 512Mi | Sufficient for Gemini calls |
| Concurrency | 80 | Requests per instance |

### Troubleshooting

**Agent not responding:**
```bash
# Check logs
gcloud run services logs read tribe-agent --region=us-central1

# Verify health
curl https://YOUR_CLOUD_RUN_URL/health
```

**CORS errors:**
- Add your frontend domain to `ADDITIONAL_CORS_ORIGINS` environment variable
- Redeploy the service

**Secret access errors:**
- Grant the Cloud Run service account access to secrets:
```bash
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
