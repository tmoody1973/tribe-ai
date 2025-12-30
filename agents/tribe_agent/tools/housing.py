"""
Housing Resources Search Tool

Provides search functionality for migrant and refugee housing assistance programs.
"""

import json
from pathlib import Path
from typing import Optional

from google.adk.tools import FunctionTool


# Load housing data at module level for efficiency
DATA_PATH = Path(__file__).parent.parent / "data" / "migrant_housing_resources.json"

try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        HOUSING_DATA = json.load(f)
    print(f"Housing data loaded: {len(HOUSING_DATA.get('housing_resources', []))} countries")
except FileNotFoundError:
    print(f"Warning: Housing data not found at {DATA_PATH}")
    HOUSING_DATA = {"housing_resources": [], "metadata": {}}
except json.JSONDecodeError as e:
    print(f"Warning: Invalid JSON in housing data: {e}")
    HOUSING_DATA = {"housing_resources": [], "metadata": {}}


async def search_housing_resources(
    country: Optional[str] = None,
    continent: Optional[str] = None,
    resource_type: Optional[str] = None,
) -> dict:
    """
    Search for housing resources and assistance programs for migrants and refugees.

    Use this when users ask about finding housing, shelter, accommodation, or
    housing assistance in a specific country or region.

    Args:
        country: Destination country to search (e.g., 'United States', 'Canada', 'Germany').
                 Can be full name or country code. Case-insensitive, partial match supported.
        continent: Filter by continent (e.g., 'North America', 'Europe', 'Asia').
                   Case-insensitive.
        resource_type: Type of resource (e.g., 'Government Agency', 'NGO',
                       'Online Platform'). Case-insensitive, partial match supported.

    Returns:
        dict containing:
        - total_found: Total number of matching resources
        - results: List of up to 10 housing resources with details
        - metadata: Information about data source and last update
        - suggestion: (Optional) Suggestion for live search if no results found
    """
    results = HOUSING_DATA.get("housing_resources", [])

    # Filter by country (case-insensitive, partial match)
    if country:
        country_lower = country.lower()
        results = [
            r for r in results
            if country_lower in r["country"].lower()
            or r.get("country_code", "").lower() == country_lower
        ]

    # Filter by continent (case-insensitive)
    if continent:
        continent_lower = continent.lower()
        results = [
            r for r in results
            if continent_lower in r["continent"].lower()
        ]

    # Extract all resources from filtered countries
    all_resources = []
    for country_data in results:
        for resource in country_data.get("resources", []):
            all_resources.append({
                "country": country_data["country"],
                "continent": country_data["continent"],
                **resource,
            })

    # Filter by resource_type (case-insensitive, partial match)
    if resource_type:
        type_lower = resource_type.lower()
        all_resources = [
            r for r in all_resources
            if type_lower in r.get("resource_type", "").lower()
        ]

    # Limit to 10 most relevant results
    limited_results = all_resources[:10]

    # If no results found and country was specified, suggest live search
    if len(all_resources) == 0 and country:
        return {
            "total_found": 0,
            "results": [],
            "metadata": HOUSING_DATA.get("metadata", {}),
            "suggestion": {
                "message": f"No housing resources found in our database for {country}. Would you like me to search for the latest programs?",
                "action": "searchLiveData",
                "actionLabel": "Search Live Data",
                "note": "Uses 1 of 50 monthly live searches",
            },
        }

    # Format results for response
    formatted_results = [
        {
            "country": r["country"],
            "continent": r["continent"],
            "organization": r.get("organization_name", "Unknown"),
            "url": r.get("url", ""),
            "description": r.get("description", ""),
            "type": r.get("resource_type", "Unknown"),
            "services": r.get("services", []),
        }
        for r in limited_results
    ]

    return {
        "total_found": len(all_resources),
        "results": formatted_results,
        "metadata": HOUSING_DATA.get("metadata", {}),
    }


# Wrap function as FunctionTool for ADK
search_housing_resources_tool = FunctionTool(search_housing_resources)
