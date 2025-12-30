"use node";

import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================
// BUDGET MANAGEMENT
// ============================================

// Create a new budget for a corridor
export const createBudget = mutation({
  args: {
    corridorId: v.id("corridors"),
    originCurrency: v.string(),
    destinationCurrency: v.string(),
    totalBudgetDestination: v.number(),
    exchangeRate: v.number(),
    allocations: v.object({
      visaImmigration: v.number(),
      tests: v.number(),
      travel: v.number(),
      settlement: v.number(),
      financial: v.number(),
      miscellaneous: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Calculate total budget in origin currency
    const totalBudgetOrigin = args.totalBudgetDestination * args.exchangeRate;

    const budgetId = await ctx.db.insert("financialBudgets", {
      userId: user._id,
      corridorId: args.corridorId,
      originCurrency: args.originCurrency,
      destinationCurrency: args.destinationCurrency,
      totalBudgetOrigin,
      totalBudgetDestination: args.totalBudgetDestination,
      createdExchangeRate: args.exchangeRate,
      allocations: args.allocations,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return budgetId;
  },
});

// Get budget for a corridor
export const getBudget = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const budget = await ctx.db
      .query("financialBudgets")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .first();

    return budget;
  },
});

// Update budget allocations
export const updateBudget = mutation({
  args: {
    budgetId: v.id("financialBudgets"),
    allocations: v.optional(
      v.object({
        visaImmigration: v.number(),
        tests: v.number(),
        travel: v.number(),
        settlement: v.number(),
        financial: v.number(),
        miscellaneous: v.number(),
      })
    ),
    totalBudgetDestination: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const budget = await ctx.db.get(args.budgetId);
    if (!budget) throw new Error("Budget not found");

    const updates: Partial<{
      allocations: typeof args.allocations;
      totalBudgetDestination: number;
      totalBudgetOrigin: number;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.allocations) {
      updates.allocations = args.allocations;
    }

    if (args.totalBudgetDestination) {
      updates.totalBudgetDestination = args.totalBudgetDestination;
      updates.totalBudgetOrigin = args.totalBudgetDestination * budget.createdExchangeRate;
    }

    await ctx.db.patch(args.budgetId, updates);

    return args.budgetId;
  },
});

// ============================================
// EXPENSE MANAGEMENT
// ============================================

// Add an expense
export const addExpense = mutation({
  args: {
    budgetId: v.id("financialBudgets"),
    corridorId: v.id("corridors"),
    name: v.string(),
    category: v.union(
      v.literal("visaImmigration"),
      v.literal("tests"),
      v.literal("travel"),
      v.literal("settlement"),
      v.literal("financial"),
      v.literal("miscellaneous")
    ),
    amountPaid: v.number(),
    currency: v.string(),
    exchangeRate: v.number(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("planned")),
    datePaid: v.optional(v.number()),
    dateDue: v.optional(v.number()),
    notes: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Calculate amount in destination currency
    const amountInDestination = args.amountPaid / args.exchangeRate;

    const expenseId = await ctx.db.insert("financialExpenses", {
      userId: user._id,
      corridorId: args.corridorId,
      budgetId: args.budgetId,
      name: args.name,
      category: args.category,
      amountPaid: args.amountPaid,
      currency: args.currency,
      exchangeRate: args.exchangeRate,
      amountInDestination,
      status: args.status,
      datePaid: args.datePaid,
      dateDue: args.dateDue,
      notes: args.notes,
      receiptUrl: args.receiptUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return expenseId;
  },
});

// Bulk import expenses from CSV with AI categorization
export const bulkImportExpenses = mutation({
  args: {
    budgetId: v.id("financialBudgets"),
    corridorId: v.id("corridors"),
    currency: v.string(),
    exchangeRate: v.number(),
    expenses: v.array(
      v.object({
        date: v.string(),
        description: v.string(),
        amount: v.number(),
        category: v.union(
          v.literal("visaImmigration"),
          v.literal("tests"),
          v.literal("travel"),
          v.literal("settlement"),
          v.literal("financial"),
          v.literal("miscellaneous")
        ),
        confidence: v.number(),
        reason: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const results = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: [] as string[],
    };

    for (const expense of args.expenses) {
      try {
        // Parse date
        let datePaid: number;
        try {
          datePaid = new Date(expense.date).getTime();
          if (isNaN(datePaid)) {
            throw new Error("Invalid date");
          }
        } catch {
          results.errors++;
          results.errorDetails.push(`Invalid date format for: ${expense.description}`);
          continue;
        }

        // Check for duplicates (same amount and date within 24 hours)
        const dayStart = datePaid - (datePaid % (24 * 60 * 60 * 1000));
        const dayEnd = dayStart + (24 * 60 * 60 * 1000);

        const existingExpenses = await ctx.db
          .query("financialExpenses")
          .withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
          .collect();

        const isDuplicate = existingExpenses.some(
          (e) =>
            e.amountPaid === expense.amount &&
            e.datePaid &&
            e.datePaid >= dayStart &&
            e.datePaid < dayEnd
        );

        if (isDuplicate) {
          results.duplicates++;
          continue;
        }

        // Calculate amount in destination currency
        const amountInDestination = expense.amount / args.exchangeRate;

        // Import expense
        await ctx.db.insert("financialExpenses", {
          userId: user._id,
          corridorId: args.corridorId,
          budgetId: args.budgetId,
          name: expense.description,
          category: expense.category,
          amountPaid: expense.amount,
          currency: args.currency,
          exchangeRate: args.exchangeRate,
          amountInDestination,
          status: "paid",
          datePaid,
          notes: `AI Categorized (${expense.confidence}% confidence): ${expense.reason}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        results.imported++;
      } catch (error) {
        results.errors++;
        results.errorDetails.push(
          `Failed to import "${expense.description}": ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return results;
  },
});

// Get all expenses for a budget
export const getExpenses = query({
  args: { budgetId: v.id("financialBudgets") },
  handler: async (ctx, { budgetId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const expenses = await ctx.db
      .query("financialExpenses")
      .withIndex("by_budget", (q) => q.eq("budgetId", budgetId))
      .collect();

    return expenses.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get upcoming expenses (next 30 days)
export const getUpcomingExpenses = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const expenses = await ctx.db
      .query("financialExpenses")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    // Filter for upcoming expenses
    return expenses
      .filter((e) => {
        if (!e.dateDue) return false;
        if (e.status === "paid") return false;
        return e.dateDue >= now && e.dateDue <= thirtyDaysFromNow;
      })
      .sort((a, b) => (a.dateDue || 0) - (b.dateDue || 0));
  },
});

// Update expense
export const updateExpense = mutation({
  args: {
    expenseId: v.id("financialExpenses"),
    name: v.optional(v.string()),
    status: v.optional(v.union(v.literal("paid"), v.literal("pending"), v.literal("planned"))),
    datePaid: v.optional(v.number()),
    dateDue: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");

    const updates: Partial<typeof args & { updatedAt: number }> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.datePaid !== undefined) updates.datePaid = args.datePaid;
    if (args.dateDue !== undefined) updates.dateDue = args.dateDue;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.expenseId, updates);

    return args.expenseId;
  },
});

// Delete expense
export const deleteExpense = mutation({
  args: { expenseId: v.id("financialExpenses") },
  handler: async (ctx, { expenseId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const expense = await ctx.db.get(expenseId);
    if (!expense) throw new Error("Expense not found");

    await ctx.db.delete(expenseId);

    return { success: true };
  },
});

// ============================================
// BUDGET SUMMARY & ANALYTICS
// ============================================

// Get budget summary with expenses
export const getBudgetSummary = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const budget = await ctx.db
      .query("financialBudgets")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .first();

    if (!budget) return null;

    const expenses = await ctx.db
      .query("financialExpenses")
      .withIndex("by_budget", (q) => q.eq("budgetId", budget._id))
      .collect();

    // Calculate totals by category
    const categoryTotals = {
      visaImmigration: 0,
      tests: 0,
      travel: 0,
      settlement: 0,
      financial: 0,
      miscellaneous: 0,
    };

    let totalSpentDestination = 0;

    for (const expense of expenses) {
      if (expense.status === "paid") {
        categoryTotals[expense.category] += expense.amountInDestination;
        totalSpentDestination += expense.amountInDestination;
      }
    }

    const percentageSpent = (totalSpentDestination / budget.totalBudgetDestination) * 100;
    const remainingBudget = budget.totalBudgetDestination - totalSpentDestination;

    // Determine status
    let status: "on-track" | "over-budget" | "under-budget";
    if (percentageSpent > 110) {
      status = "over-budget";
    } else if (percentageSpent < 90) {
      status = "under-budget";
    } else {
      status = "on-track";
    }

    return {
      budget,
      expenses,
      totalSpentDestination,
      remainingBudget,
      percentageSpent,
      categoryTotals,
      status,
    };
  },
});

// ============================================
// CURRENCY EXCHANGE RATES
// ============================================

// Get exchange rate
export const getExchangeRate = query({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
  },
  handler: async (ctx, { fromCurrency, toCurrency }) => {
    const rate = await ctx.db
      .query("currencyRates")
      .withIndex("by_pair", (q) =>
        q.eq("fromCurrency", fromCurrency).eq("toCurrency", toCurrency)
      )
      .order("desc")
      .first();

    return rate;
  },
});

// Save exchange rate (internal)
export const saveExchangeRate = internalMutation({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
    rate: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("currencyRates", {
      fromCurrency: args.fromCurrency,
      toCurrency: args.toCurrency,
      rate: args.rate,
      source: args.source,
      timestamp: Date.now(),
    });
  },
});

// Update all exchange rates (internal action - called by cron)
export const updateExchangeRates = internalAction({
  args: {},
  handler: async (ctx) => {
    const commonPairs = [
      { from: "NGN", to: "CAD" },
      { from: "NGN", to: "USD" },
      { from: "NGN", to: "GBP" },
      { from: "NGN", to: "EUR" },
      { from: "INR", to: "CAD" },
      { from: "INR", to: "USD" },
      { from: "INR", to: "GBP" },
      { from: "INR", to: "EUR" },
      { from: "PHP", to: "CAD" },
      { from: "PHP", to: "USD" },
      { from: "PHP", to: "GBP" },
      { from: "PHP", to: "EUR" },
      { from: "KES", to: "CAD" },
      { from: "KES", to: "USD" },
      { from: "MXN", to: "USD" },
      { from: "MXN", to: "CAD" },
      { from: "BRL", to: "USD" },
      { from: "BRL", to: "CAD" },
      { from: "BRL", to: "EUR" },
      { from: "VND", to: "USD" },
      { from: "VND", to: "CAD" },
      { from: "VND", to: "JPY" },
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const pair of commonPairs) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(
          `${appUrl}/api/exchange-rate?from=${pair.from}&to=${pair.to}`
        );

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        await ctx.runMutation(internal.financial.saveExchangeRate, {
          fromCurrency: pair.from,
          toCurrency: pair.to,
          rate: data.rate,
          source: data.source,
        });

        successCount++;
        console.log(`✓ Updated ${pair.from} → ${pair.to}: ${data.rate}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to update ${pair.from} → ${pair.to}:`, error);
      }
    }

    console.log(`Exchange rates updated: ${successCount} success, ${errorCount} errors`);

    return { success: successCount, errors: errorCount };
  },
});

// ============================================
// SAVINGS GOALS MANAGEMENT
// ============================================

// Create a new savings goal
export const createSavingsGoal = mutation({
  args: {
    corridorId: v.id("corridors"),
    budgetId: v.id("financialBudgets"),
    name: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.number(),
    currency: v.string(),
    targetDate: v.optional(v.number()),
    enableMilestones: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Create default milestones if enabled
    const milestones = args.enableMilestones
      ? [
          {
            amount: args.targetAmount * 0.25,
            label: "First Quarter",
            achieved: false,
          },
          {
            amount: args.targetAmount * 0.50,
            label: "Halfway There",
            achieved: false,
          },
          {
            amount: args.targetAmount * 0.75,
            label: "Three Quarters",
            achieved: false,
          },
          {
            amount: args.targetAmount * 1.0,
            label: "Goal Achieved",
            achieved: false,
          },
        ]
      : undefined;

    const goalId = await ctx.db.insert("savingsGoals", {
      userId: user._id,
      corridorId: args.corridorId,
      budgetId: args.budgetId,
      name: args.name,
      description: args.description,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      currency: args.currency,
      targetDate: args.targetDate,
      milestones,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return goalId;
  },
});

// Get all savings goals for a corridor
export const getSavingsGoals = query({
  args: {
    corridorId: v.id("corridors"),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
  },
  handler: async (ctx, { corridorId, status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    let query = ctx.db
      .query("savingsGoals")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      );

    const goals = await query.collect();

    // Filter by status if provided
    if (status) {
      return goals.filter((goal) => goal.status === status);
    }

    return goals;
  },
});

// Update goal progress (add savings)
export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amountToAdd: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const newCurrentAmount = goal.currentAmount + args.amountToAdd;
    const progress = (newCurrentAmount / goal.targetAmount) * 100;

    // Check for newly achieved milestones
    let updatedMilestones = goal.milestones;
    const newlyAchievedMilestones: string[] = [];

    if (updatedMilestones) {
      updatedMilestones = updatedMilestones.map((milestone) => {
        if (!milestone.achieved && newCurrentAmount >= milestone.amount) {
          newlyAchievedMilestones.push(milestone.label);
          return {
            ...milestone,
            achieved: true,
            achievedAt: Date.now(),
          };
        }
        return milestone;
      });
    }

    // Check if goal is now completed
    const isCompleted = newCurrentAmount >= goal.targetAmount;
    const newStatus = isCompleted ? "completed" : goal.status;

    await ctx.db.patch(args.goalId, {
      currentAmount: newCurrentAmount,
      milestones: updatedMilestones,
      status: newStatus as "active" | "completed" | "paused",
      completedAt: isCompleted ? Date.now() : goal.completedAt,
      updatedAt: Date.now(),
    });

    // Create notifications for newly achieved milestones
    for (const milestoneLabel of newlyAchievedMilestones) {
      await ctx.db.insert("notifications", {
        userId: goal.userId,
        type: "milestone_achieved",
        title: "🎉 Milestone Reached!",
        message: `You've achieved ${milestoneLabel} for "${goal.name}"!`,
        metadata: {
          goalId: args.goalId,
          amount: newCurrentAmount,
        },
        read: false,
        createdAt: Date.now(),
      });
    }

    // Create notification for goal completion
    if (isCompleted) {
      await ctx.db.insert("notifications", {
        userId: goal.userId,
        type: "goal_completed",
        title: "🎊 Goal Completed!",
        message: `Congratulations! You've completed "${goal.name}" with ${goal.currency} ${newCurrentAmount.toFixed(2)} saved!`,
        metadata: {
          goalId: args.goalId,
          amount: newCurrentAmount,
        },
        read: false,
        createdAt: Date.now(),
      });
    }

    // Return info about newly achieved milestones for UI celebration
    return {
      progress: Math.round(progress),
      newlyAchievedMilestones,
      isCompleted,
    };
  },
});

// Pause a savings goal
export const pauseGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, { goalId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const goal = await ctx.db.get(goalId);
    if (!goal) throw new Error("Goal not found");

    await ctx.db.patch(goalId, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

// Resume a paused savings goal
export const resumeGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, { goalId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const goal = await ctx.db.get(goalId);
    if (!goal) throw new Error("Goal not found");

    await ctx.db.patch(goalId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

// Manually complete a savings goal
export const completeGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, { goalId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const goal = await ctx.db.get(goalId);
    if (!goal) throw new Error("Goal not found");

    await ctx.db.patch(goalId, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update savings goal details
export const updateSavingsGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.targetDate !== undefined) updates.targetDate = args.targetDate;

    // If target amount changes, recalculate milestones
    if (args.targetAmount !== undefined && args.targetAmount !== goal.targetAmount) {
      updates.targetAmount = args.targetAmount;

      if (goal.milestones) {
        updates.milestones = goal.milestones.map((milestone, index) => {
          const percentages = [0.25, 0.50, 0.75, 1.0];
          return {
            ...milestone,
            amount: args.targetAmount! * percentages[index],
            achieved: goal.currentAmount >= args.targetAmount! * percentages[index],
          };
        });
      }
    }

    await ctx.db.patch(args.goalId, updates);
  },
});

// Delete a savings goal
export const deleteSavingsGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, { goalId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const goal = await ctx.db.get(goalId);
    if (!goal) throw new Error("Goal not found");

    await ctx.db.delete(goalId);
  },
});

// ============================================
// SAVINGS ANALYTICS & INSIGHTS
// ============================================

// Calculate savings velocity and consistency
export const getSavingsVelocity = query({
  args: {
    corridorId: v.id("corridors"),
    periodDays: v.number(), // 7, 30, 90, etc.
  },
  handler: async (ctx, { corridorId, periodDays }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalSaved: 0,
        avgPerDay: 0,
        avgPerWeek: 0,
        avgPerMonth: 0,
        contributionCount: 0,
        consistency: 0,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return {
        totalSaved: 0,
        avgPerDay: 0,
        avgPerWeek: 0,
        avgPerMonth: 0,
        contributionCount: 0,
        consistency: 0,
      };
    }

    // Get all goals for the corridor
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    // Calculate total savings in the period
    const startDate = Date.now() - periodDays * 24 * 60 * 60 * 1000;

    // Simple calculation based on goals updated in period
    const recentUpdates = goals.filter((g) => g.updatedAt >= startDate);
    const totalSaved = recentUpdates.reduce((sum, g) => sum + g.currentAmount, 0);

    const avgPerDay = totalSaved / periodDays;
    const avgPerWeek = avgPerDay * 7;
    const avgPerMonth = avgPerDay * 30;

    // Calculate consistency (percentage of weeks with activity)
    const weeksInPeriod = Math.ceil(periodDays / 7);
    const weeksWithActivity = new Set(
      recentUpdates.map((g) => {
        const weekNumber = Math.floor(g.updatedAt / (7 * 24 * 60 * 60 * 1000));
        return weekNumber;
      })
    ).size;

    const consistency = weeksInPeriod > 0 ? Math.round((weeksWithActivity / weeksInPeriod) * 100) : 0;

    return {
      totalSaved,
      avgPerDay,
      avgPerWeek,
      avgPerMonth,
      contributionCount: recentUpdates.length,
      consistency,
    };
  },
});

// Get savings streak information
export const getSavingsStreak = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { currentStreak: 0, longestStreak: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return { currentStreak: 0, longestStreak: 0 };

    // Get all goals sorted by update time
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user_corridor", (q) =>
        q.eq("userId", user._id).eq("corridorId", corridorId)
      )
      .collect();

    if (goals.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Group goals by week
    const weeklyUpdates = new Map<number, boolean>();
    goals.forEach((goal) => {
      const weekNumber = Math.floor(goal.updatedAt / (7 * 24 * 60 * 60 * 1000));
      weeklyUpdates.set(weekNumber, true);
    });

    // Calculate current streak
    const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    let currentStreak = 0;
    let week = currentWeek;

    while (weeklyUpdates.has(week)) {
      currentStreak++;
      week--;
    }

    // Calculate longest streak
    const sortedWeeks = Array.from(weeklyUpdates.keys()).sort((a, b) => a - b);
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedWeeks.length; i++) {
      if (sortedWeeks[i] === sortedWeeks[i - 1] + 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
    };
  },
});

// ============================================
// NOTIFICATIONS
// ============================================

// Create a notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("milestone_achieved"),
      v.literal("goal_completed"),
      v.literal("behind_schedule"),
      v.literal("weekly_reminder"),
      v.literal("streak_risk")
    ),
    title: v.string(),
    message: v.string(),
    goalId: v.optional(v.id("savingsGoals")),
    amount: v.optional(v.number()),
    milestone: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      metadata: {
        goalId: args.goalId,
        amount: args.amount,
        milestone: args.milestone,
      },
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Get notifications for current user
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { limit = 20, unreadOnly = false }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const notifications = await query.take(limit);

    if (unreadOnly) {
      return notifications.filter((n) => !n.read);
    }

    return notifications;
  },
});

// Mark notification as read
export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return unreadNotifications.length;
  },
});
