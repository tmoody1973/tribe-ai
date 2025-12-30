"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { protocolSynthesizer, buildSynthesisPrompt } from "../../agents/protocolSynthesizer";
import { buildDependencyGraph, topologicalSort } from "../../lib/graph/dependencyGraph";
import { selectBestAttribution, normalizeAttribution, validateAttribution } from "../../lib/scoring/attribution";

// Type definitions for synthesis
interface RawProtocol {
  category: string;
  title: string;
  description: string;
  priority: string;
  dependsOn?: string[];
  warnings?: string[];
  hacks?: string[];
  attribution?: {
    sourceUrl: string;
    authorName?: string;
    engagement?: number;
  };
}

interface SynthesisOutput {
  protocols: RawProtocol[];
}

type ProtocolCategory = "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
type ProtocolPriority = "critical" | "high" | "medium" | "low";

// Explicit return type to avoid circular reference errors
export interface SynthesisResult {
  protocolIds: string[];
  count: number;
  errors: string[];
}

/**
 * Valid categories for protocols
 */
const VALID_CATEGORIES = new Set([
  "visa",
  "finance",
  "housing",
  "employment",
  "legal",
  "health",
  "social",
]);

/**
 * Valid priorities for protocols
 */
const VALID_PRIORITIES = new Set(["critical", "high", "medium", "low"]);

/**
 * Parse protocols from agent response
 */
function parseProtocolsFromResponse(text: string): SynthesisOutput {
  // Try to extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch =
    text.match(/```json\n?([\s\S]*?)\n?```/) ||
    text.match(/```\n?([\s\S]*?)\n?```/) ||
    text.match(/\{[\s\S]*"protocols"[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse protocols from synthesis response - no JSON found");
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.protocols || !Array.isArray(parsed.protocols)) {
      throw new Error("Response missing 'protocols' array");
    }
    return parsed as SynthesisOutput;
  } catch (error) {
    throw new Error(`Failed to parse protocols JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate and normalize a category
 */
function validateCategory(category: string): ProtocolCategory {
  const normalized = category.toLowerCase().trim();
  if (VALID_CATEGORIES.has(normalized)) {
    return normalized as ProtocolCategory;
  }
  // Default to "legal" for unknown categories
  console.warn(`Invalid category "${category}", defaulting to "legal"`);
  return "legal";
}

/**
 * Validate and normalize a priority
 */
function validatePriority(priority: string): ProtocolPriority {
  const normalized = priority.toLowerCase().trim();
  if (VALID_PRIORITIES.has(normalized)) {
    return normalized as ProtocolPriority;
  }
  // Default to "medium" for unknown priorities
  console.warn(`Invalid priority "${priority}", defaulting to "medium"`);
  return "medium";
}

/**
 * Synthesize protocols from ingested content
 */
export const synthesizeProtocols = action({
  args: {
    corridorId: v.id("corridors"),
    targetLanguage: v.optional(v.string()),
  },
  handler: async (ctx, { corridorId, targetLanguage = "en" }): Promise<SynthesisResult> => {
    const errors: string[] = [];

    // Fetch ingested content for this corridor
    const content = await ctx.runQuery(api.ingestedContent.getContentByCorridor, {
      corridorId,
    });

    if (content.length === 0) {
      throw new Error("No research content found. Run research first.");
    }

    // Get corridor details
    const corridor = await ctx.runQuery(api.corridors.getCorridor, {
      id: corridorId,
    });

    if (!corridor) {
      throw new Error("Corridor not found");
    }

    // Prepare content for synthesis
    const researchText = content
      .map((c: any) => `[Source: ${c.url}]\n${c.content}`)
      .join("\n\n---\n\n");

    // Limit content to avoid token limits (~100k chars)
    const truncatedContent =
      researchText.length > 100000
        ? researchText.substring(0, 100000) + "\n\n[Content truncated due to length]"
        : researchText;

    console.log(
      `Synthesizing protocols for ${corridor.origin} → ${corridor.destination} from ${content.length} sources`
    );

    // Generate synthesis prompt and execute agent
    const prompt = buildSynthesisPrompt(
      corridor.origin,
      corridor.destination,
      truncatedContent,
      targetLanguage
    );

    let result;
    try {
      result = await protocolSynthesizer.generate(prompt, {
        maxSteps: 1, // Synthesis doesn't need tool calls
      });
    } catch (error) {
      const errorMsg = `Synthesis agent error: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      return { protocolIds: [], count: 0, errors };
    }

    // Parse JSON from response
    let parsed: SynthesisOutput;
    try {
      parsed = parseProtocolsFromResponse(result.text ?? "");
    } catch (error) {
      const errorMsg = `Parse error: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      return { protocolIds: [], count: 0, errors };
    }

    if (parsed.protocols.length === 0) {
      errors.push("No protocols extracted from synthesis");
      return { protocolIds: [], count: 0, errors };
    }

    console.log(`Parsed ${parsed.protocols.length} protocols, building dependency graph...`);

    // Build dependency graph and order
    const graph = buildDependencyGraph(parsed.protocols);
    const ordered = topologicalSort(graph);

    // Create final protocols with validated data
    const protocols = ordered.map((protocol, index) => {
      // Validate and normalize attribution
      let attribution;
      if (protocol.attribution) {
        const normalized = normalizeAttribution(protocol.attribution);
        if (validateAttribution(normalized)) {
          const selected = selectBestAttribution({ attribution: normalized }, content as any);
          attribution = selected
            ? {
                sourceUrl: selected.sourceUrl,
                authorName: selected.authorName,
                engagement: selected.engagement,
              }
            : undefined;
        }
      }

      return {
        category: validateCategory(protocol.category),
        title: protocol.title.substring(0, 200), // Limit title length
        description: protocol.description.substring(0, 5000), // Limit description length
        priority: validatePriority(protocol.priority),
        order: index + 1,
        warnings: protocol.warnings?.slice(0, 5), // Limit to 5 warnings
        hacks: protocol.hacks?.slice(0, 5), // Limit to 5 hacks
        attribution,
      };
    });

    if (protocols.length === 0) {
      errors.push("No valid protocols after validation");
      return { protocolIds: [], count: 0, errors };
    }

    // Save to database
    console.log(`Saving ${protocols.length} protocols to database...`);
    const ids = await ctx.runMutation(api.protocols.batchCreateProtocols, {
      corridorId,
      protocols,
    });

    console.log(`Successfully stored ${ids.length} protocols`);

    return {
      protocolIds: ids,
      count: ids.length,
      errors,
    };
  },
});

/**
 * Re-synthesize protocols for a corridor (deletes existing and creates new)
 */
export const resynthesizeProtocols = action({
  args: {
    corridorId: v.id("corridors"),
    targetLanguage: v.optional(v.string()),
  },
  handler: async (ctx, { corridorId, targetLanguage }): Promise<SynthesisResult> => {
    // Get existing protocols
    const existing = await ctx.runQuery(api.protocols.getProtocols, {
      corridorId,
    });

    // Delete existing AI-generated protocols
    for (const protocol of existing) {
      if (protocol.aiGenerated) {
        await ctx.runMutation(api.protocols.deleteProtocol, {
          id: protocol._id,
        });
      }
    }

    // Synthesize new protocols
    return await ctx.runAction(api.ai.synthesis.synthesizeProtocols, { corridorId, targetLanguage });
  },
});
