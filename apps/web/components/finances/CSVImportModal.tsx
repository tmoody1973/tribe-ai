"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Upload, X, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  category: "visaImmigration" | "tests" | "travel" | "settlement" | "financial" | "miscellaneous";
  confidence: number;
  reason: string;
}

interface CSVImportModalProps {
  corridorId: Id<"corridors">;
  budgetId: Id<"financialBudgets">;
  currency: string;
  exchangeRate: number;
  onClose: () => void;
}

export function CSVImportModal({
  corridorId,
  budgetId,
  currency,
  exchangeRate,
  onClose,
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "review" | "importing" | "complete">("upload");
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
    errorDetails?: string[];
  } | null>(null);

  const bulkImportExpenses = useMutation(api.financial.bulkImportExpenses);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStep("review");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("corridorId", corridorId);
    formData.append("budgetId", budgetId);
    formData.append("currency", currency);

    try {
      const response = await fetch("/api/import-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process CSV file");
      }

      const data = await response.json();
      setTransactions(data.transactions);

      // Select all transactions by default
      setSelectedTransactions(new Set(data.transactions.map((_: any, i: number) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process CSV file");
      setStep("upload");
    }
  };

  const handleImport = async () => {
    if (selectedTransactions.size === 0) {
      setError("Please select at least one transaction to import");
      return;
    }

    setStep("importing");
    setError(null);

    const selectedExpenses = Array.from(selectedTransactions).map(i => transactions[i]);

    try {
      const result = await bulkImportExpenses({
        budgetId,
        corridorId,
        currency,
        exchangeRate,
        expenses: selectedExpenses,
      });

      setImportResult(result);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import expenses");
      setStep("review");
    }
  };

  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map((_, i) => i)));
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      visaImmigration: "📋 Visa & Immigration",
      tests: "🎓 Tests",
      travel: "✈️ Travel",
      settlement: "🏠 Settlement",
      financial: "💳 Financial",
      miscellaneous: "📱 Miscellaneous",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      visaImmigration: "bg-purple-100 text-purple-700",
      tests: "bg-blue-100 text-blue-700",
      travel: "bg-green-100 text-green-700",
      settlement: "bg-orange-100 text-orange-700",
      financial: "bg-red-100 text-red-700",
      miscellaneous: "bg-gray-100 text-gray-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-4 border-black flex items-center justify-between">
          <h2 className="text-2xl font-black">📊 Import Bank Statement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <p className="text-gray-600">
                Upload a CSV or Excel file from your bank. We'll automatically categorize your transactions using AI.
              </p>

              {/* File Upload Area */}
              <div
                className={`border-4 border-dashed ${file ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"} p-8 text-center transition-colors`}
              >
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  {file ? (
                    <>
                      <FileText className="w-16 h-16 mx-auto mb-4 text-green-600" />
                      <p className="font-bold text-lg mb-2">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-sm text-green-600 mt-2">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="font-bold text-lg mb-2">Drop CSV file here or click to upload</p>
                      <p className="text-sm text-gray-600">
                        Supports CSV and Excel files (max 5MB, 100 transactions)
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="border-2 border-gray-200 bg-gray-50 p-4">
                <p className="font-bold mb-2">📝 CSV Format Requirements:</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Must include columns: Date, Description, Amount</li>
                  <li>Common column names are automatically detected</li>
                  <li>Duplicate transactions are automatically skipped</li>
                  <li>All amounts will be converted to {currency}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">
                  Review and select transactions to import ({selectedTransactions.size} of {transactions.length} selected)
                </p>
                <button
                  onClick={toggleAll}
                  className="px-3 py-1 border-2 border-black font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  {selectedTransactions.size === transactions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {error && (
                <div className="border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className={`border-2 p-3 cursor-pointer transition-colors ${
                      selectedTransactions.has(index)
                        ? "border-black bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => toggleTransaction(index)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(index)}
                        onChange={() => toggleTransaction(index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-bold">{transaction.description}</p>
                            <p className="text-sm text-gray-600">{transaction.date}</p>
                          </div>
                          <p className="font-bold text-lg">
                            {currency} {transaction.amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-1 text-xs font-bold border-2 ${getCategoryColor(transaction.category)}`}
                          >
                            {getCategoryLabel(transaction.category)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {transaction.confidence}% confident
                          </span>
                          <span className="text-xs text-gray-500">
                            · {transaction.reason}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-transparent mb-4" />
              <p className="font-bold text-lg">Importing {selectedTransactions.size} transactions...</p>
              <p className="text-gray-600">This may take a moment</p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && importResult && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                <h3 className="text-2xl font-black mb-2">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-green-300 bg-green-50 p-4 text-center">
                  <p className="text-3xl font-black text-green-700">{importResult.imported}</p>
                  <p className="text-sm text-green-600 font-bold">Imported</p>
                </div>
                <div className="border-2 border-yellow-300 bg-yellow-50 p-4 text-center">
                  <p className="text-3xl font-black text-yellow-700">{importResult.duplicates}</p>
                  <p className="text-sm text-yellow-600 font-bold">Duplicates Skipped</p>
                </div>
                <div className="border-2 border-red-300 bg-red-50 p-4 text-center">
                  <p className="text-3xl font-black text-red-700">{importResult.errors}</p>
                  <p className="text-sm text-red-600 font-bold">Errors</p>
                </div>
              </div>

              {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                <div className="border-2 border-red-300 bg-red-50 p-4 max-h-48 overflow-y-auto">
                  <p className="font-bold mb-2 text-red-700">Error Details:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {importResult.errorDetails.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black flex justify-end gap-3">
          {step === "upload" && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file}
                className="px-6 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Process File
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                onClick={() => {
                  setStep("upload");
                  setTransactions([]);
                  setSelectedTransactions(new Set());
                  setError(null);
                }}
                className="px-6 py-2 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedTransactions.size === 0}
                className="px-6 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Import {selectedTransactions.size} Transaction{selectedTransactions.size !== 1 ? "s" : ""}
              </button>
            </>
          )}

          {step === "complete" && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
