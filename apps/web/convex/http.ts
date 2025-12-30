import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * HTTP Router for Convex
 *
 * Provides REST API endpoints for external services (ADK agent) to interact with Convex.
 */

const http = httpRouter();

/**
 * GET /api/fireplexity/quota
 * Check if Fireplexity quota is available for live searches
 */
http.route({
  path: "/api/fireplexity/quota",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const quota = await ctx.runQuery(api.fireplexityQueries.checkFireplexityQuota);
      return new Response(JSON.stringify(quota), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

/**
 * POST /api/fireplexity/search
 * Execute a Fireplexity (Perplexity + Firecrawl) search
 *
 * Body: { query: string, targetCountry?: string }
 */
http.route({
  path: "/api/fireplexity/search",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { query, targetCountry } = body as {
        query: string;
        targetCountry?: string;
      };

      if (!query || typeof query !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing required 'query' parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const result = await ctx.runAction(api.fireplexity.fireplexitySearch, {
        query,
        targetCountry,
      });

      return new Response(JSON.stringify(result), {
        status: result.error ? 400 : 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
http.route({
  path: "/api/fireplexity/quota",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/api/fireplexity/search",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// ============================================================================
// Visa Discovery Endpoints
// ============================================================================

/**
 * POST /api/visa/requirements
 * Get visa requirements for a corridor (origin → destination)
 *
 * Body: { origin: string (ISO3), destination: string (ISO3), forceRefresh?: boolean }
 */
http.route({
  path: "/api/visa/requirements",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { origin, destination, forceRefresh } = body as {
        origin: string;
        destination: string;
        forceRefresh?: boolean;
      };

      if (!origin || !destination) {
        return new Response(
          JSON.stringify({ error: true, message: "Missing required 'origin' and 'destination' parameters" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const result = await ctx.runAction(internal.visaDiscovery.getVisaRequirementsForCorridor, {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        forceRefresh,
      });

      return new Response(JSON.stringify(result), {
        status: result.error ? 400 : 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: true, message: String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

/**
 * POST /api/visa/processing-times
 * Get estimated processing times for a visa application
 *
 * Body: { origin: string, destination: string, visaType: string }
 */
http.route({
  path: "/api/visa/processing-times",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { origin, destination, visaType } = body as {
        origin: string;
        destination: string;
        visaType: string;
      };

      if (!origin || !destination || !visaType) {
        return new Response(
          JSON.stringify({ error: true, message: "Missing required parameters" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const result = await ctx.runAction(internal.visaDiscovery.getProcessingTimes, {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        visaType,
      });

      return new Response(JSON.stringify(result), {
        status: result.error ? 400 : 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: true, message: String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

/**
 * OPTIONS handlers for visa endpoints
 */
http.route({
  path: "/api/visa/requirements",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/api/visa/processing-times",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// ============================================================================
// User Context Endpoint
// ============================================================================

/**
 * GET /api/user/context
 * Get user's current context including todos, progress, and corridor info
 *
 * Query params: corridorId (required)
 *
 * Returns:
 * - todos: Recent tasks (top 5)
 * - progress: Protocol completion stats
 * - corridorInfo: Basic corridor metadata
 */
http.route({
  path: "/api/user/context",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const corridorId = url.searchParams.get("corridorId");

      if (!corridorId) {
        return new Response(
          JSON.stringify({ error: true, message: "Missing required 'corridorId' parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Fetch tasks and protocols in parallel
      const [tasks, protocols] = await Promise.all([
        ctx.runQuery(api.tasks.getTasks, {
          corridorId: corridorId as unknown as import("./_generated/dataModel").Id<"corridors">,
        }),
        ctx.runQuery(api.protocols.getProtocols, {
          corridorId: corridorId as unknown as import("./_generated/dataModel").Id<"corridors">,
        }),
      ]);

      // Calculate progress
      const completedProtocols = protocols?.filter(
        (p) => (p as unknown as { status?: string }).status === "completed"
      ).length || 0;
      const totalProtocols = protocols?.length || 0;

      // Get recent non-completed tasks
      const activeTasks = tasks
        ?.filter((t) => (t as unknown as { column?: string }).column !== "done")
        .slice(0, 5)
        .map((t) => {
          const task = t as unknown as { title: string; column: string; priority?: string; category?: string };
          return {
            title: task.title,
            column: task.column,
            priority: task.priority,
            category: task.category,
          };
        }) || [];

      return new Response(
        JSON.stringify({
          success: true,
          todos: activeTasks,
          progress: {
            completed: completedProtocols,
            total: totalProtocols,
            percentage: totalProtocols > 0
              ? Math.round((completedProtocols / totalProtocols) * 100)
              : 0,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: true, message: String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

http.route({
  path: "/api/user/context",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
