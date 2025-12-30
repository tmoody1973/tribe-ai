"""
User Context Tool for TRIBE Agent

Fetches user's current context from Convex including:
- Active tasks (todos)
- Migration progress (protocols completed)

This tool is internal (not shown in UI) and used by the agent
to provide personalized, context-aware responses.
"""

import os
from typing import Optional
import httpx
from google.adk.tools import FunctionTool

CONVEX_SITE_URL = os.environ.get("CONVEX_SITE_URL", "")


async def get_user_context(corridor_id: str) -> dict:
    """
    Fetch user's current context including todos, documents, and progress.
    Use this to provide personalized, context-aware responses.

    This tool is internal and helps you understand the user's current state:
    - What tasks they're working on
    - How far they've progressed in their migration journey
    - What they might need help with

    Args:
        corridor_id: The active corridor ID from the user's context

    Returns:
        dict with:
        - todos: List of active tasks (title, column, priority, category)
        - progress: Protocol completion stats (completed, total, percentage)
        - error: Error message if fetch failed
    """
    if not corridor_id:
        return {
            "error": True,
            "message": "No corridor ID provided. User may not have an active corridor.",
        }

    if not CONVEX_SITE_URL:
        return {
            "error": True,
            "message": "CONVEX_SITE_URL not configured. Cannot fetch user context.",
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{CONVEX_SITE_URL}/api/user/context",
                params={"corridorId": corridor_id},
            )

            if response.status_code != 200:
                return {
                    "error": True,
                    "message": f"Failed to fetch context: HTTP {response.status_code}",
                }

            data = response.json()

            if data.get("error"):
                return data

            # Format the response for agent consumption
            todos = data.get("todos", [])
            progress = data.get("progress", {})

            # Build a natural language summary
            summary_parts = []

            if todos:
                task_list = ", ".join([t.get("title", "Untitled") for t in todos[:3]])
                if len(todos) > 3:
                    summary_parts.append(
                        f"The user has {len(todos)} active tasks including: {task_list}, and more."
                    )
                else:
                    summary_parts.append(
                        f"The user has {len(todos)} active task(s): {task_list}."
                    )
            else:
                summary_parts.append("The user has no active tasks.")

            if progress.get("total", 0) > 0:
                pct = progress.get("percentage", 0)
                completed = progress.get("completed", 0)
                total = progress.get("total", 0)
                summary_parts.append(
                    f"Migration progress: {completed}/{total} protocols completed ({pct}%)."
                )
            else:
                summary_parts.append("No migration protocols have been set up yet.")

            return {
                "success": True,
                "todos": todos,
                "progress": progress,
                "summary": " ".join(summary_parts),
            }

        except httpx.TimeoutException:
            return {
                "error": True,
                "message": "Request timed out while fetching user context.",
            }
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to fetch user context: {str(e)}",
            }


# Export as FunctionTool for ADK
get_user_context_tool = FunctionTool(get_user_context)
