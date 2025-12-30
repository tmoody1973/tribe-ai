"""
Live Data Search Tool

Provides real-time web search for up-to-date migration resources using
Fireplexity (Perplexity + Firecrawl) via Convex HTTP endpoints.
"""

import os
from typing import Optional

import httpx
from google.adk.tools import FunctionTool


# Convex site URL for HTTP endpoints
CONVEX_SITE_URL = os.environ.get("CONVEX_SITE_URL", "")


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
        - scrapedData: Preview of scraped content from sources
        - quotaRemaining: Number of searches left this month
        - OR error: True with message if search failed
    """
    if not CONVEX_SITE_URL:
        return {
            "error": True,
            "message": "Live search is not configured. CONVEX_SITE_URL environment variable is missing.",
        }

    async with httpx.AsyncClient(timeout=60.0) as client:
        # Step 1: Check quota first
        try:
            quota_response = await client.get(f"{CONVEX_SITE_URL}/api/fireplexity/quota")
            if quota_response.status_code != 200:
                return {
                    "error": True,
                    "message": f"Could not check quota (status {quota_response.status_code}). Please try again.",
                }

            quota = quota_response.json()

            if not quota.get("available", False):
                return {
                    "error": True,
                    "quotaExceeded": True,
                    "message": f"Live search quota exceeded ({quota['used']}/{quota['limit']} used). Quota resets in {quota['daysUntilReset']} days.",
                    "quotaStatus": quota,
                    "suggestion": "Try searching the cached housing and visa databases instead, or check back next month!",
                }
        except httpx.TimeoutException:
            return {
                "error": True,
                "message": "Quota check timed out. Please try again.",
            }
        except Exception as e:
            return {
                "error": True,
                "message": f"Could not check quota: {str(e)}. Please try again.",
            }

        # Step 2: Execute the search
        try:
            search_response = await client.post(
                f"{CONVEX_SITE_URL}/api/fireplexity/search",
                json={
                    "query": query,
                    "targetCountry": target_country,
                },
            )

            if search_response.status_code != 200:
                error_data = search_response.json()
                return {
                    "error": True,
                    "message": error_data.get("message", f"Search failed with status {search_response.status_code}"),
                }

            result = search_response.json()

            # Check if the result itself is an error
            if result.get("error"):
                return result

            # Format successful response
            scraped_data = []
            for item in result.get("scrapedData", []):
                if item.get("markdown"):
                    scraped_data.append({
                        "url": item.get("url", ""),
                        "title": item.get("title", ""),
                        "preview": item.get("markdown", "")[:500] + "..." if len(item.get("markdown", "")) > 500 else item.get("markdown", ""),
                    })
                elif not item.get("error"):
                    scraped_data.append({
                        "url": item.get("url", ""),
                        "title": item.get("title", ""),
                        "preview": "Content available at source",
                    })

            quota_status = result.get("quotaStatus", {})

            return {
                "success": True,
                "answer": result.get("answer", ""),
                "sources": result.get("sources", []),
                "scrapedData": scraped_data,
                "dataFreshness": result.get("dataFreshness", "Real-time"),
                "quotaRemaining": quota_status.get("remaining", 0),
                "quotaUsed": quota_status.get("used", 0),
                "quotaLimit": quota_status.get("limit", 50),
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
