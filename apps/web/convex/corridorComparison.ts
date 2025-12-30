import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all corridors for a user with financial summaries
 * Used for corridor comparison dashboard
 */
export const getAllCorridorsWithFinancials = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Get all corridors for this user
    const corridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // For each corridor, get financial summary
    const corridorsWithFinancials = await Promise.all(
      corridors.map(async (corridor) => {
        // Get budget
        const budget = await ctx.db
          .query("financialBudgets")
          .withIndex("by_user_corridor", (q) =>
            q.eq("userId", user._id).eq("corridorId", corridor._id)
          )
          .first();

        // Get savings goals
        const savingsGoals = await ctx.db
          .query("savingsGoals")
          .withIndex("by_user_corridor", (q) =>
            q.eq("userId", user._id).eq("corridorId", corridor._id)
          )
          .collect();

        // Calculate totals
        const totalBudget = budget?.totalBudgetDestination || 0;
        const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
        const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
        const fundingPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

        // Get protocols count for progress tracking
        const protocols = await ctx.db
          .query("protocols")
          .withIndex("by_corridor", (q) => q.eq("corridorId", corridor._id))
          .collect();

        const completedProtocols = protocols.filter((p) => p.status === "completed").length;

        const protocolProgress = protocols.length > 0 ? (completedProtocols / protocols.length) * 100 : 0;

        return {
          corridor,
          budget: {
            total: totalBudget,
            currency: budget?.destinationCurrency || "USD",
            originCurrency: budget?.originCurrency,
          },
          savings: {
            totalSaved,
            totalTarget,
            fundingPercentage: Math.round(fundingPercentage),
            goalsCount: savingsGoals.length,
            activeGoalsCount: savingsGoals.filter((g) => g.status === "active").length,
          },
          progress: {
            protocolsTotal: protocols.length,
            protocolsCompleted: completedProtocols,
            percentage: Math.round(protocolProgress),
          },
          feasibilityScore: calculateFeasibilityScore(
            fundingPercentage,
            protocolProgress,
            corridor.stage
          ),
        };
      })
    );

    // Sort by feasibility score (highest first)
    corridorsWithFinancials.sort((a, b) => b.feasibilityScore - a.feasibilityScore);

    return {
      corridors: corridorsWithFinancials,
      primaryCorridor: corridorsWithFinancials.find((c) => c.corridor.isPrimary),
      totalCorridors: corridorsWithFinancials.length,
    };
  },
});

/**
 * Get detailed comparison for specific corridors
 */
export const compareCorridors = query({
  args: {
    corridorIds: v.array(v.id("corridors")),
  },
  handler: async (ctx, { corridorIds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const comparisons = await Promise.all(
      corridorIds.map(async (corridorId) => {
        const corridor = await ctx.db.get(corridorId);
        if (!corridor || corridor.userId !== user._id) return null;

        const budget = await ctx.db
          .query("financialBudgets")
          .withIndex("by_user_corridor", (q) =>
            q.eq("userId", user._id).eq("corridorId", corridorId)
          )
          .first();

        // Get category breakdown from allocations
        const allocations = budget?.allocations || {
          visaImmigration: 0,
          tests: 0,
          travel: 0,
          settlement: 0,
          financial: 0,
          miscellaneous: 0,
        };

        const totalBudget = budget?.totalBudgetDestination || 0;

        return {
          corridorId,
          name: corridor.name || `${corridor.origin} → ${corridor.destination}`,
          budget: {
            total: totalBudget,
            currency: budget?.destinationCurrency || "USD",
            breakdown: Object.entries(allocations).map(([category, allocated]) => ({
              category,
              allocated,
              percentage: totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0,
            })),
          },
        };
      })
    );

    return comparisons.filter((c) => c !== null);
  },
});

/**
 * Set primary corridor and enable allocation mode
 */
export const setPrimaryCorridor = mutation({
  args: {
    corridorId: v.id("corridors"),
    enableAllocation: v.optional(v.boolean()),
  },
  handler: async (ctx, { corridorId, enableAllocation = false }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Verify corridor belongs to user
    const corridor = await ctx.db.get(corridorId);
    if (!corridor || corridor.userId !== user._id) {
      throw new Error("Corridor not found");
    }

    // Unset primary flag on all other corridors
    const allCorridors = await ctx.db
      .query("corridors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const c of allCorridors) {
      if (c._id !== corridorId && c.isPrimary) {
        await ctx.db.patch(c._id, {
          isPrimary: false,
          allocationMode: "exploration",
        });
      }
    }

    // Set new primary
    await ctx.db.patch(corridorId, {
      isPrimary: true,
      allocationMode: enableAllocation ? "committed" : "exploration",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update savings allocation for a corridor
 */
export const updateSavingsAllocation = mutation({
  args: {
    corridorId: v.id("corridors"),
    allocatedAmount: v.number(),
  },
  handler: async (ctx, { corridorId, allocatedAmount }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const corridor = await ctx.db.get(corridorId);
    if (!corridor || corridor.userId !== user._id) {
      throw new Error("Corridor not found");
    }

    // Update allocation
    await ctx.db.patch(corridorId, {
      allocatedSavings: allocatedAmount,
      updatedAt: Date.now(),
    });

    // Recalculate feasibility score
    const savingsGoals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const fundingPercentage = totalTarget > 0 ? (allocatedAmount / totalTarget) * 100 : 0;

    await ctx.db.patch(corridorId, {
      feasibilityScore: Math.min(100, Math.round(fundingPercentage)),
    });

    return { success: true, feasibilityScore: Math.min(100, Math.round(fundingPercentage)) };
  },
});

/**
 * Calculate feasibility score (0-100)
 * Based on: funding %, protocol progress, stage
 */
function calculateFeasibilityScore(
  fundingPercentage: number,
  protocolProgress: number,
  stage: string
): number {
  // Funding is most important (60% weight)
  const fundingScore = fundingPercentage * 0.6;

  // Protocol progress (30% weight)
  const progressScore = protocolProgress * 0.3;

  // Stage bonus (10% weight)
  const stageScore =
    {
      dreaming: 0,
      planning: 2,
      preparing: 5,
      relocating: 8,
      settling: 10,
    }[stage] || 0;

  const totalScore = fundingScore + progressScore + stageScore;

  return Math.min(100, Math.round(totalScore));
}
