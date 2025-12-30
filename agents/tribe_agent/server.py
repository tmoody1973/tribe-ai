"""
TRIBE ADK Agent Server

FastAPI server exposing the ADK agent via AG-UI protocol.
Designed to be consumed by CopilotKit in the Next.js frontend.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

from agent import tribe_agent

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("Starting TRIBE ADK Agent...")
    yield
    print("Shutting down TRIBE ADK Agent...")


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
