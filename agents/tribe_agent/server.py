"""
TRIBE ADK Agent Server

FastAPI server exposing the ADK agent via AG-UI protocol.
Designed to be consumed by CopilotKit in the Next.js frontend.
"""

import os
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables BEFORE importing agent (tools read env at import time)
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

from agent import tribe_agent
from logging_config import setup_logging, get_logger

# Setup structured logging
log_level = os.environ.get("LOG_LEVEL", "INFO")
setup_logging(log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting TRIBE ADK Agent", extra={"environment": os.environ.get("ENVIRONMENT", "development")})
    yield
    logger.info("Shutting down TRIBE ADK Agent")


# Create FastAPI app
app = FastAPI(
    title="TRIBE ADK Agent",
    description="Migration assistance agent powered by Google Gemini",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration - allow all origins for API endpoints
# The AG-UI protocol already handles authentication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing information."""
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    # Log request start
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "path": str(request.url.path),
            "method": request.method,
        }
    )

    response = await call_next(request)

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000

    # Log request completion
    logger.info(
        f"Request completed: {response.status_code}",
        extra={
            "request_id": request_id,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }
    )

    # Add request ID to response headers for tracing
    response.headers["X-Request-ID"] = request_id
    return response


# Wrap the ADK agent for AG-UI protocol
adk_agent = ADKAgent(
    adk_agent=tribe_agent,
    app_name="tribe_ai",
    user_id="default_user",  # Will be overridden by CopilotKit context
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)

# Mount AG-UI endpoint at /agui
add_adk_fastapi_endpoint(app, adk_agent, path="/agui")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "TRIBE ADK Agent",
        "version": "1.0.0",
        "docs": "/docs",
        "agui_endpoint": "/agui",
        "health": "/health",
    }


@app.get("/health")
async def health():
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "agent": "tribe_agent",
        "model": "gemini-2.5-flash",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "version": "2024-12-31-v8",  # Track deployment version - removed ADK live_search tool, use frontend tool
    }


@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to check which env vars are set (not values)."""
    env_vars = ["GEMINI_API_KEY", "PERPLEXITY_API_KEY", "CONVEX_SITE_URL", "ENVIRONMENT", "LOG_LEVEL"]
    return {
        var: "SET" if os.environ.get(var) else "NOT SET"
        for var in env_vars
    }


@app.get("/debug/test-perplexity")
async def test_perplexity():
    """Test if Perplexity API key is accessible."""
    key = os.environ.get("PERPLEXITY_API_KEY", "")
    return {
        "perplexity_key": "SET" if key else "NOT SET",
        "key_prefix": key[:10] + "..." if key else "NONE",
    }


@app.get("/debug/test-search")
async def test_search():
    """Actually call the live search function to test it end-to-end."""
    from tools.live_search import search_live_data
    result = await search_live_data("test query Belgium visa", "Belgium")
    # Return truncated result to avoid huge response
    if result.get("success"):
        return {
            "status": "SUCCESS",
            "answer_preview": result.get("answer", "")[:200] + "...",
            "sources_count": len(result.get("sources", [])),
        }
    else:
        return {
            "status": "ERROR",
            "error": result,
        }


# ============================================
# API Endpoints for Frontend Tool Calls
# ============================================


class LiveSearchRequest(BaseModel):
    """Request model for live search."""
    query: str
    target_country: Optional[str] = None


@app.post("/api/live-search")
async def api_live_search(request: LiveSearchRequest):
    """
    API endpoint for live search - called directly by frontend tools.
    This bypasses the ADK agent and calls Perplexity directly.
    """
    from tools.live_search import search_live_data

    logger.info(
        f"Live search API called",
        extra={
            "query": request.query[:50] + "..." if len(request.query) > 50 else request.query,
            "target_country": request.target_country,
        }
    )

    result = await search_live_data(request.query, request.target_country)
    return result


if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=os.environ.get("ENVIRONMENT") == "development",
    )
