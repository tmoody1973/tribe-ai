"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Loader2, Plus, DollarSign, Upload } from "lucide-react";
import { CSVImportModal } from "@/components/finances/CSVImportModal";
import { CreateBudgetWizard } from "@/components/finances/CreateBudgetWizard";

export default function FinancesPage() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  const corridor = useQuery(api.corridors.getActiveCorridor) as Doc<"corridors"> | undefined | null;
  const budget = useQuery(
    api.financial.getBudget,
    corridor ? { corridorId: corridor._id } : "skip"
  );
  const summary = useQuery(
    api.financial.getBudgetSummary,
    corridor ? { corridorId: corridor._id } : "skip"
  );
  const upcomingExpenses = useQuery(
    api.financial.getUpcomingExpenses,
    corridor ? { corridorId: corridor._id } : "skip"
  );

  // Loading state
  if (corridor === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // No corridor
  if (!corridor) {
    return (
      <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <DollarSign className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
        <h2 className="text-xl font-bold mb-2">No corridor found</h2>
        <p className="text-gray-600">Complete onboarding to start tracking your migration budget.</p>
      </div>
    );
  }

  // No budget yet - show creation wizard
  if (!budget) {
    return (
      <div className="space-y-6">
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
          <h1 className="text-3xl font-black mb-2">💰 Financial Tracker</h1>
          <p className="text-gray-600">Track your migration expenses and budget</p>
        </div>

        <CreateBudgetWizard corridor={corridor} />
      </div>
    );
  }

  const percentSpent = summary
    ? Math.round(summary.percentageSpent)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-green-100 text-green-700 border-green-300";
      case "over-budget":
        return "bg-red-100 text-red-700 border-red-300";
      case "under-budget":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">💰 Financial Tracker</h1>
            <p className="text-gray-600">
              {corridor.origin} → {corridor.destination}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCSVImport(true)}
              className="px-4 py-2 border-2 border-black font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Upload size={20} />
              Import CSV
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      {summary && (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-black mb-4">📊 Budget Progress</h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-bold">
                ${summary.totalSpentDestination.toFixed(2)} {budget.destinationCurrency}
              </span>
              <span className="text-gray-600">
                of ${budget.totalBudgetDestination.toFixed(2)} {budget.destinationCurrency}
              </span>
            </div>
            <div className="h-8 bg-gray-200 border-2 border-black relative overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percentSpent > 100 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              />
            </div>
            <div className="mt-2 text-right text-sm font-bold">{percentSpent}%</div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 border-2 rounded font-bold text-sm ${getStatusColor(
                summary.status
              )}`}
            >
              {summary.status.toUpperCase().replace("-", " ")}
            </span>
            <span className="text-gray-600">
              ${summary.remainingBudget.toFixed(2)} {budget.destinationCurrency} remaining
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Expenses */}
      {upcomingExpenses && upcomingExpenses.length > 0 && (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-black mb-4">📅 Upcoming Expenses</h2>
          <div className="space-y-3">
            {upcomingExpenses.slice(0, 5).map((expense) => {
              const daysUntil = Math.ceil(
                ((expense.dateDue || 0) - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200"
                >
                  <div>
                    <div className="font-bold">{expense.name}</div>
                    <div className="text-sm text-gray-600">
                      Due in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      ${expense.amountInDestination.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">{expense.currency}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      {summary && summary.expenses.length > 0 && (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-black mb-4">💳 Recent Expenses</h2>
          <div className="space-y-2">
            {summary.expenses.slice(0, 10).map((expense) => (
              <div
                key={expense._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 border-b-2 border-gray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-bold">{expense.name}</div>
                  <div className="text-sm text-gray-600">
                    {expense.category.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${expense.amountInDestination.toFixed(2)} {budget.destinationCurrency}
                  </div>
                  <div
                    className={`text-xs font-bold ${
                      expense.status === "paid"
                        ? "text-green-600"
                        : expense.status === "pending"
                          ? "text-yellow-600"
                          : "text-blue-600"
                    }`}
                  >
                    {expense.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          corridorId={corridor._id}
          budgetId={budget._id}
          destinationCurrency={budget.destinationCurrency}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImportModal
          corridorId={corridor._id}
          budgetId={budget._id}
          currency={budget.destinationCurrency}
          exchangeRate={1} // Default to 1, will be updated with actual rate from API
          onClose={() => setShowCSVImport(false)}
        />
      )}
    </div>
  );
}

// Simple Add Expense Modal
function AddExpenseModal({
  corridorId,
  budgetId,
  destinationCurrency,
  onClose,
}: {
  corridorId: Doc<"corridors">["_id"];
  budgetId: Doc<"budgets">["_id"];
  destinationCurrency: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<
    "visaImmigration" | "tests" | "travel" | "settlement" | "financial" | "miscellaneous"
  >("visaImmigration");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"paid" | "pending" | "planned">("paid");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addExpense = useMutation(api.financial.addExpense);
  const _getExchangeRate = useQuery(api.financial.getExchangeRate, {
    fromCurrency: destinationCurrency,
    toCurrency: destinationCurrency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        budgetId,
        corridorId,
        name,
        category,
        amountPaid: parseFloat(amount),
        currency: destinationCurrency,
        exchangeRate: 1, // Same currency, rate is 1
        status,
        datePaid: status === "paid" ? Date.now() : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] max-w-md w-full">
        <h2 className="text-2xl font-black mb-4">➕ Add Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block font-bold mb-2">Expense Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Medical Examination"
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as "visaImmigration" | "tests" | "travel" | "settlement" | "financial" | "miscellaneous")}
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="visaImmigration">📋 Visa & Immigration</option>
              <option value="tests">🎓 Tests</option>
              <option value="travel">✈️ Travel</option>
              <option value="settlement">🏠 Settlement</option>
              <option value="financial">💳 Financial</option>
              <option value="miscellaneous">📱 Miscellaneous</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-bold mb-2">Amount ({destinationCurrency}) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="250.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block font-bold mb-2">Status *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`flex-1 px-3 py-2 border-2 border-black font-bold transition-colors ${
                  status === "paid" ? "bg-green-500 text-white" : "bg-white hover:bg-gray-100"
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`flex-1 px-3 py-2 border-2 border-black font-bold transition-colors ${
                  status === "pending" ? "bg-yellow-500 text-white" : "bg-white hover:bg-gray-100"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus("planned")}
                className={`flex-1 px-3 py-2 border-2 border-black font-bold transition-colors ${
                  status === "planned" ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
                }`}
              >
                Planned
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
