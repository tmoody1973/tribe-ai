"""
TRIBE ADK Agent Definition

This agent provides migration assistance using Google Gemini via ADK.
It connects to the frontend via AG-UI protocol through CopilotKit.
"""

from typing import Any, Optional
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

# Import tools from tools directory
from tools.housing import search_housing_resources_tool
from tools.live_search import search_live_data_tool
from tools.visa import search_visa_options_tool
from tools.context import get_user_context_tool

# Base system instruction for the TRIBE assistant
BASE_SYSTEM_INSTRUCTION = """You are TRIBE, an AI migration assistant helping people navigate their
international relocation journey. You provide expert guidance on:

1. **Visa & Immigration**: Visa requirements, application processes, timelines, and pathways
2. **Housing**: Finding accommodation, understanding rental markets, and housing resources
3. **Financial Planning**: Cost of living, expense tracking, and budget management
4. **Cultural Adaptation**: Local customs, language tips, and community resources
5. **Task Management**: Helping users track their migration tasks and deadlines

Always be helpful, accurate, and encouraging. When you don't know something, say so clearly.

For specific data queries, use the available tools to search the knowledge base.
When suggesting actions, be proactive but ask for confirmation on significant changes.
"""

# Language names for instruction
LANGUAGE_NAMES = {
    "en": "English",
    "yo": "Yoruba",
    "hi": "Hindi",
    "pt": "Portuguese",
    "tl": "Tagalog",
    "es": "Spanish",
    "fr": "French",
    "zh": "Chinese",
    "ar": "Arabic",
}

# Migration stage descriptions
STAGE_DESCRIPTIONS = {
    "dreaming": "They are in the early dreaming phase, exploring possibilities and considering their options.",
    "planning": "They are actively planning their migration journey, researching requirements and timelines.",
    "preparing": "They are preparing documents, finances, and logistics for their move.",
    "relocating": "They are in the process of relocating to their destination country.",
    "settling": "They have arrived and are settling into their new home and community.",
}


def build_system_prompt(context=None) -> str:
    """
    Build dynamic system prompt with user context from CopilotKit properties.

    The context is passed via AG-UI protocol from CopilotKit's properties prop.
    ADK passes a ReadonlyContext object, not a dict.

    Args:
        context: Optional ReadonlyContext or dict containing user/corridor state

    Returns:
        Complete system prompt with personalized context
    """
    context_parts = []

    if context:
        # Handle both ReadonlyContext objects and dicts
        def safe_get(obj, key, default=None):
            """Safely get a value from dict or object with attributes."""
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            # Try attribute access for ReadonlyContext
            return getattr(obj, key, default)

        try:
            # Extract corridor information
            corridor = safe_get(context, "corridor")
            if corridor:
                origin = safe_get(corridor, "origin")
                destination = safe_get(corridor, "destination")
                if origin and destination:
                    context_parts.append(
                        f"The user is planning to migrate from {origin} to {destination}. "
                        f"Reference their specific corridor when relevant (e.g., 'For your {origin} → {destination} journey...')."
                    )

            # Extract migration stage
            stage = safe_get(context, "stage")
            if stage and stage in STAGE_DESCRIPTIONS:
                context_parts.append(STAGE_DESCRIPTIONS[stage])

            # Extract language preference
            language = safe_get(context, "language", "en")
            lang_name = LANGUAGE_NAMES.get(language, "English") if language else "English"
            if language and language != "en":
                context_parts.append(
                    f"IMPORTANT: The user prefers {lang_name}. Respond in {lang_name} unless they request otherwise."
                )
            else:
                context_parts.append(
                    f"Respond in {lang_name} unless the user requests otherwise."
                )

            # Note about user context tool
            if safe_get(context, "userId"):
                context_parts.append(
                    "You can use the get_user_context tool to fetch the user's current todos, "
                    "saved documents, and migration progress for more personalized assistance."
                )
        except Exception as e:
            # Log but don't fail - return base instruction
            print(f"Warning: Error processing context: {e}")

    if context_parts:
        return BASE_SYSTEM_INSTRUCTION + "\n\n## CURRENT USER CONTEXT:\n" + "\n".join(context_parts)

    return BASE_SYSTEM_INSTRUCTION


# Placeholder tool function - actual tools will be added in Story 10.3
async def get_agent_info() -> dict:
    """
    Get information about the TRIBE agent.

    Returns:
        dict with agent information
    """
    return {
        "name": "TRIBE",
        "version": "1.0.0",
        "model": "gemini-2.5-flash",
        "capabilities": [
            "visa_guidance",
            "housing_search",
            "financial_planning",
            "task_management",
        ],
    }


# Wrap function as FunctionTool
get_agent_info_tool = FunctionTool(get_agent_info)

# Create the ADK LlmAgent with dynamic instruction
# The instruction callable receives context from AG-UI protocol (CopilotKit properties)
tribe_agent = LlmAgent(
    name="tribe_agent",
    model="gemini-2.5-flash",
    instruction=build_system_prompt,  # Dynamic instruction based on user context
    tools=[
        get_agent_info_tool,
        search_housing_resources_tool,
        search_live_data_tool,
        search_visa_options_tool,
        get_user_context_tool,
    ],
)
