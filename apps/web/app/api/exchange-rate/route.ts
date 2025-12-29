import { NextRequest } from "next/server";

/**
 * Exchange Rate API
 * Uses exchangeratesapi.io (FREE tier: 250 requests/month)
 * Alternative: exchangerate-api.com (FREE tier: 1,500 requests/month)
 *
 * GET /api/exchange-rate?from=NGN&to=CAD
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "USD";
  const to = searchParams.get("to") || "CAD";

  try {
    // Try exchangeratesapi.io first (more reliable, official European Central Bank rates)
    // Falls back to exchangerate-api.com if no API key configured
    const apiKey = process.env.EXCHANGE_RATES_API_KEY;

    let response;
    let source;

    if (apiKey) {
      // Use exchangeratesapi.io (requires API key)
      response = await fetch(
        `https://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&base=${from}&symbols=${to}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      source = "exchangeratesapi.io";
    } else {
      // Fallback to exchangerate-api.com (no API key needed)
      response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      source = "exchangerate-api.com";
    }

    if (!response.ok) {
      throw new Error(`Exchange API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract rate for target currency
    const rate = data.rates?.[to];

    if (!rate) {
      return Response.json(
        { error: `Rate not found for ${from} → ${to}` },
        { status: 404 }
      );
    }

    return Response.json({
      from,
      to,
      rate,
      timestamp: Date.now(),
      source,
      // Include all rates for reference if needed
      allRates: data.rates,
    });
  } catch (error) {
    const err = error as Error;
    console.error(`Exchange rate fetch error (${from} → ${to}):`, err.message);

    return Response.json(
      {
        error: "Failed to fetch exchange rate",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

