"""
Visa Search Tool

Provides visa requirement discovery and pathway information for migration corridors.
"""

import os
from typing import Optional

import httpx
from google.adk.tools import FunctionTool


# Convex site URL for HTTP endpoints
CONVEX_SITE_URL = os.environ.get("CONVEX_SITE_URL", "")


# Comprehensive country name to ISO3 code mappings
COUNTRY_CODES = {
    # North America
    "united states": "USA", "usa": "USA", "us": "USA", "america": "USA", "united states of america": "USA",
    "canada": "CAN", "ca": "CAN",
    "mexico": "MEX", "mx": "MEX",

    # Europe
    "united kingdom": "GBR", "uk": "GBR", "britain": "GBR", "england": "GBR", "great britain": "GBR",
    "germany": "DEU", "de": "DEU", "deutschland": "DEU",
    "france": "FRA", "fr": "FRA",
    "spain": "ESP", "es": "ESP",
    "italy": "ITA", "it": "ITA",
    "netherlands": "NLD", "nl": "NLD", "holland": "NLD",
    "belgium": "BEL", "be": "BEL",
    "switzerland": "CHE", "ch": "CHE", "swiss": "CHE",
    "austria": "AUT", "at": "AUT",
    "poland": "POL", "pl": "POL",
    "portugal": "PRT", "pt": "PRT",
    "ireland": "IRL", "ie": "IRL",
    "sweden": "SWE", "se": "SWE",
    "norway": "NOR", "no": "NOR",
    "denmark": "DNK", "dk": "DNK",
    "finland": "FIN", "fi": "FIN",
    "greece": "GRC", "gr": "GRC",

    # Oceania
    "australia": "AUS", "au": "AUS",
    "new zealand": "NZL", "nz": "NZL",

    # Asia
    "india": "IND", "in": "IND",
    "china": "CHN", "cn": "CHN",
    "japan": "JPN", "jp": "JPN",
    "south korea": "KOR", "korea": "KOR", "kr": "KOR",
    "philippines": "PHL", "ph": "PHL",
    "singapore": "SGP", "sg": "SGP",
    "malaysia": "MYS", "my": "MYS",
    "thailand": "THA", "th": "THA",
    "vietnam": "VNM", "vn": "VNM",
    "indonesia": "IDN", "id": "IDN",
    "pakistan": "PAK", "pk": "PAK",
    "bangladesh": "BGD", "bd": "BGD",
    "uae": "ARE", "united arab emirates": "ARE", "dubai": "ARE",
    "saudi arabia": "SAU", "sa": "SAU",
    "israel": "ISR", "il": "ISR",
    "turkey": "TUR", "tr": "TUR",

    # Africa
    "nigeria": "NGA", "ng": "NGA",
    "south africa": "ZAF", "za": "ZAF",
    "egypt": "EGY", "eg": "EGY",
    "kenya": "KEN", "ke": "KEN",
    "ghana": "GHA", "gh": "GHA",
    "ethiopia": "ETH", "et": "ETH",
    "morocco": "MAR", "ma": "MAR",

    # South America
    "brazil": "BRA", "br": "BRA",
    "argentina": "ARG", "ar": "ARG",
    "colombia": "COL", "co": "COL",
    "chile": "CHL", "cl": "CHL",
    "peru": "PER", "pe": "PER",
    "venezuela": "VEN", "ve": "VEN",
}

# Known valid ISO3 codes for validation
VALID_ISO3_CODES = set(COUNTRY_CODES.values())


def normalize_country_code(code: str) -> tuple[str, Optional[str]]:
    """
    Convert country name or code to ISO3 format.

    Returns:
        tuple of (normalized_code, error_message)
        If successful, error_message is None
    """
    if not code or not isinstance(code, str):
        return "", "Country code cannot be empty"

    normalized = code.strip().lower()

    # Check if it's a known country name
    if normalized in COUNTRY_CODES:
        return COUNTRY_CODES[normalized], None

    # Check if it's already a valid ISO3 code
    upper_code = code.strip().upper()
    if len(upper_code) == 3 and upper_code.isalpha():
        if upper_code in VALID_ISO3_CODES:
            return upper_code, None
        # It looks like an ISO3 code but we don't recognize it
        # Still return it but let the API validate
        return upper_code, None

    # Check if it's an ISO2 code (2 letters)
    if len(upper_code) == 2 and upper_code.isalpha():
        # Try to find in our mappings
        if normalized in COUNTRY_CODES:
            return COUNTRY_CODES[normalized], None
        return "", f"Unknown country code '{code}'. Please use ISO 3166-1 alpha-3 format (e.g., USA, CAN, GBR) or full country name."

    return "", f"Could not recognize '{code}'. Try using the full country name or ISO3 code (e.g., 'United States' or 'USA')."


def get_country_suggestions(query: str) -> list[str]:
    """Get similar country names for suggestions."""
    query_lower = query.lower()
    suggestions = []

    for name, code in COUNTRY_CODES.items():
        if query_lower in name or name.startswith(query_lower[:3]):
            suggestions.append(f"{name.title()} ({code})")
            if len(suggestions) >= 5:
                break

    return suggestions


async def search_visa_options(
    origin: str,
    destination: str,
    get_processing_times: bool = False,
) -> dict:
    """
    Discover visa requirements and pathways for migration between countries.

    Use this when users ask about visa requirements, work permits, or immigration
    options between specific countries.

    Args:
        origin: Origin country (passport country). Can be full name like 'Nigeria'
                or ISO 3166-1 alpha-3 code like 'NGA'.
        destination: Destination country. Can be full name like 'Canada'
                     or ISO 3166-1 alpha-3 code like 'CAN'.
        get_processing_times: Whether to fetch real-time processing time estimates.
                              This uses additional API quota.

    Returns:
        dict containing:
        - success: Whether the request succeeded
        - visaRequired: Whether a visa is required
        - visaType: Type of visa needed (e.g., 'Work Visa', 'Tourist Visa')
        - stayDuration: Allowed stay duration
        - requirements: List of required documents/steps
        - estimatedCost: Estimated visa cost
        - processingTime: (optional) Estimated processing time in days
        - OR error: True with message if request failed
    """
    if not CONVEX_SITE_URL:
        return {
            "error": True,
            "message": "Visa search is not configured. CONVEX_SITE_URL environment variable is missing.",
        }

    # Normalize country codes
    origin_code, origin_error = normalize_country_code(origin)
    if origin_error:
        suggestions = get_country_suggestions(origin)
        return {
            "error": True,
            "message": f"Invalid origin country: {origin_error}",
            "suggestions": suggestions if suggestions else None,
        }

    dest_code, dest_error = normalize_country_code(destination)
    if dest_error:
        suggestions = get_country_suggestions(destination)
        return {
            "error": True,
            "message": f"Invalid destination country: {dest_error}",
            "suggestions": suggestions if suggestions else None,
        }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Get visa requirements
            response = await client.post(
                f"{CONVEX_SITE_URL}/api/visa/requirements",
                json={
                    "origin": origin_code,
                    "destination": dest_code,
                },
            )

            if response.status_code != 200:
                error_data = response.json()
                return {
                    "error": True,
                    "message": error_data.get("message", f"Request failed with status {response.status_code}"),
                }

            visa_data = response.json()

            # Check if the result itself is an error
            if visa_data.get("error"):
                return visa_data

            # Format successful response
            result = {
                "success": True,
                "origin": origin_code,
                "destination": dest_code,
                "visaRequired": visa_data.get("visaRequired", True),
                "visaType": visa_data.get("visaType", "Unknown"),
                "stayDuration": visa_data.get("stayDuration", "Varies"),
                "requirements": visa_data.get("requirements", []),
                "estimatedCost": visa_data.get("cost") or visa_data.get("estimatedCost"),
                "cached": visa_data.get("cached", False),
                "quotaRemaining": visa_data.get("quotaRemaining"),
            }

            # Optionally get processing times
            if get_processing_times and result["visaType"] and result["visaType"] != "Unknown":
                try:
                    times_response = await client.post(
                        f"{CONVEX_SITE_URL}/api/visa/processing-times",
                        json={
                            "origin": origin_code,
                            "destination": dest_code,
                            "visaType": result["visaType"],
                        },
                    )

                    if times_response.status_code == 200:
                        times_data = times_response.json()
                        if times_data.get("success") or times_data.get("averageProcessingDays"):
                            result["processingTime"] = {
                                "averageDays": times_data.get("averageProcessingDays"),
                                "source": times_data.get("source", "estimated"),
                                "cached": times_data.get("cached", False),
                            }
                except Exception:
                    pass  # Processing times are optional

            return result

        except httpx.TimeoutException:
            return {
                "error": True,
                "message": "Request timed out. Please try again.",
            }
        except Exception as e:
            return {
                "error": True,
                "message": f"Failed to fetch visa information: {str(e)}",
            }


# Wrap function as FunctionTool for ADK
search_visa_options_tool = FunctionTool(search_visa_options)
