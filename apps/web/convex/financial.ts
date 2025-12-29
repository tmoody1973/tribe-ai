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
