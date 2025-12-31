"""
TRIBE ADK Agent Server

FastAPI server exposing the ADK agent via AG-UI protocol.
Designed to be consumed by CopilotKit in the Next.js frontend.
"""

import os
import time
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv

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

# CORS configuration for development and production
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev
    "http://localhost:3001",  # Alternative dev port
    "https://tribe-ai.vercel.app",  # Production
]

# Add additional origins from environment
if os.environ.get("ADDITIONAL_CORS_ORIGINS"):
    ALLOWED_ORIGINS.extend(os.environ["ADDITIONAL_CORS_ORIGINS"].split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    }


@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to check which env vars are set (not values)."""
    env_vars = ["GEMINI_API_KEY", "PERPLEXITY_API_KEY", "CONVEX_SITE_URL", "ENVIRONMENT", "LOG_LEVEL"]
    return {
        var: "SET" if os.environ.get(var) else "NOT SET"
        for var in env_vars
    }


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
