"""
Live Data Search Tool

Provides real-time web search for up-to-date migration resources using
Perplexity API directly.
"""

import os
from typing import Optional

import httpx
from google.adk.tools import FunctionTool


# Perplexity API configuration
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

# Simple monthly quota tracking (resets on agent restart - basic implementation)
# For production, you'd want to persist this in a database
_monthly_quota = {"used": 0, "limit": 50}


async def search_live_data(
    query: str,
    target_country: Optional[str] = None,
) -> dict:
    """
    Search live web data for up-to-date migration resources, visa updates,
    housing programs, and policy changes.

    IMPORTANT: This uses limited monthly quota (50 searches/month).
    Only use when:
    - User explicitly requests current/latest information
    - Static data search returned no results
    - Information needs to be verified as current
    - User asks about recent policy changes or updates

    Args:
        query: Search query describing what the user is looking for.
               Examples: 'housing programs for refugees', 'work visa requirements 2025'
        target_country: Optional country to focus the search (e.g., 'Germany', 'Canada').
                        Helps narrow results to relevant region.

    Returns:
        dict containing:
        - success: Whether search completed successfully
        - answer: AI-generated answer from Perplexity
        - sources: List of source URLs
        - quotaRemaining: Number of searches left this month
        - OR error: True with message if search failed
    """
    if not PERPLEXITY_API_KEY:
        return {
            "error": True,
            "message": "Live search is not configured. PERPLEXITY_API_KEY environment variable is missing.",
        }

    # Check quota (basic in-memory tracking)
    if _monthly_quota["used"] >= _monthly_quota["limit"]:
        return {
            "error": True,
            "quotaExceeded": True,
            "message": f"Live search quota exceeded ({_monthly_quota['used']}/{_monthly_quota['limit']} used).",
            "quotaStatus": {
                "used": _monthly_quota["used"],
                "limit": _monthly_quota["limit"],
                "daysUntilReset": 1,  # Approximate
            },
            "suggestion": "Try searching the cached housing and visa databases instead, or check back later!",
        }

    # Build search query with country context
    search_query = query
    if target_country:
        search_query = f"{query} in {target_country}"

    # System prompt for migration-focused responses
    system_prompt = """You are a migration research assistant. Provide accurate, up-to-date information about:
- Visa requirements and application processes
- Housing programs and resources for migrants
- Immigration policy changes and updates
- Cost of living and relocation information

Be concise but thorough. Always cite specific sources when possible. Focus on practical, actionable information."""

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                PERPLEXITY_API_URL,
                headers={
                    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "sonar",  # Perplexity's web-search model
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": search_query},
                    ],
                    "temperature": 0.2,  # Lower for factual accuracy
                    "return_citations": True,
                    "return_related_questions": False,
                },
            )

            if response.status_code != 200:
                error_text = response.text
                return {
                    "error": True,
                    "message": f"Search failed (status {response.status_code}): {error_text[:200]}",
                }

            result = response.json()

            # Update quota
            _monthly_quota["used"] += 1

            # Extract answer and citations
            answer = ""
            sources = []

            if "choices" in result and len(result["choices"]) > 0:
                message = result["choices"][0].get("message", {})
                answer = message.get("content", "")

            # Perplexity returns citations in the response
            if "citations" in result:
                sources = result["citations"]

            return {
                "success": True,
                "answer": answer,
                "sources": sources,
                "dataFreshness": "Real-time",
                "quotaRemaining": _monthly_quota["limit"] - _monthly_quota["used"],
                "quotaUsed": _monthly_quota["used"],
                "quotaLimit": _monthly_quota["limit"],
            }

        except httpx.TimeoutException:
            return {
                "error": True,
                "message": "Search timed out. Please try a more specific query or try again later.",
            }
        except Exception as e:
            return {
                "error": True,
                "message": f"Search failed: {str(e)}. Please try again.",
            }


# Wrap function as FunctionTool for ADK
search_live_data_tool = FunctionTool(search_live_data)
