import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Papa from "papaparse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  rawRow: any;
}

interface CategorizedTransaction extends ParsedTransaction {
  category: "visaImmigration" | "tests" | "travel" | "settlement" | "financial" | "miscellaneous";
  confidence: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const corridorId = formData.get("corridorId") as string;
    const budgetId = formData.get("budgetId") as string;
    const currency = formData.get("currency") as string;

    if (!file || !corridorId || !budgetId || !currency) {
      return NextResponse.json(
        { error: "Missing required fields: file, corridorId, budgetId, currency" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file." },
        { status: 400 }
      );
    }

    // Parse CSV file
    const fileContent = await file.text();
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parse errors:", parseResult.errors);
      return NextResponse.json(
        { error: "Failed to parse CSV file", details: parseResult.errors },
        { status: 400 }
      );
    }

    // Extract transactions from CSV
    const transactions = extractTransactions(parseResult.data);
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in CSV file" },
        { status: 400 }
      );
    }

    // Limit to 100 transactions per upload
    const limitedTransactions = transactions.slice(0, 100);

    // Categorize transactions using Gemini AI (batch of 10)
    const categorizedTransactions = await categorizeTransactions(limitedTransactions);

    // Return categorized transactions for user review
    return NextResponse.json({
      success: true,
      transactions: categorizedTransactions,
      summary: {
        total: categorizedTransactions.length,
        skipped: transactions.length - limitedTransactions.length,
      },
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Extract transactions from parsed CSV data
 * Attempts to detect common column names for date, description, and amount
 */
function extractTransactions(data: any[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Common column name variations
  const dateColumns = ["date", "transaction date", "posted date", "value date", "datetime"];
  const descriptionColumns = ["description", "memo", "details", "transaction details", "merchant", "payee"];
  const amountColumns = ["amount", "debit", "withdrawal", "payment", "value", "transaction amount"];

  // Detect columns from first row
  const firstRow = data[0];
  const headers = Object.keys(firstRow);

  const dateCol = headers.find(h => dateColumns.includes(h)) || headers.find(h => h.includes("date"));
  const descCol = headers.find(h => descriptionColumns.includes(h)) || headers.find(h => h.includes("desc"));
  const amountCol = headers.find(h => amountColumns.includes(h)) || headers.find(h => h.includes("amount"));

  if (!dateCol || !descCol || !amountCol) {
    console.error("Could not detect required columns", { dateCol, descCol, amountCol, headers });
    throw new Error("Could not detect date, description, or amount columns in CSV");
  }

  for (const row of data) {
    try {
      const date = row[dateCol];
      const description = row[descCol];
      const amountStr = row[amountCol];

      if (!date || !description || !amountStr) continue;

      // Parse amount (handle negative values, commas, currency symbols)
      const cleanAmount = String(amountStr)
        .replace(/[$£€¥₹₦,]/g, "")
        .replace(/[()]/g, "-") // Negative amounts sometimes in parentheses
        .trim();
      const amount = Math.abs(parseFloat(cleanAmount));

      if (isNaN(amount) || amount === 0) continue;

      transactions.push({
        date,
        description: String(description).trim(),
        amount,
        rawRow: row,
      });
    } catch (error) {
      console.error("Error parsing transaction row:", error, row);
      // Skip invalid rows
    }
  }

  return transactions;
}

/**
 * Categorize transactions using Gemini AI
 * Processes in batches of 10 to stay within rate limits
 */
async function categorizeTransactions(
  transactions: ParsedTransaction[]
): Promise<CategorizedTransaction[]> {
  const categorized: CategorizedTransaction[] = [];
  const batchSize = 10;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const batchResult = await categorizeBatch(batch);
    categorized.push(...batchResult);

    // Small delay between batches to respect rate limits
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return categorized;
}

/**
 * Categorize a batch of transactions using Gemini
 */
async function categorizeBatch(
  transactions: ParsedTransaction[]
): Promise<CategorizedTransaction[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Categorize these migration-related expenses into one of these categories:

CATEGORIES:
- visaImmigration: Visa fees, document fees, embassy appointments, passport renewals, visa applications
- tests: Language tests (IELTS, TEF, etc.), medical exams, credential evaluations, background checks
- travel: Flights, accommodation, transport, travel insurance, baggage fees
- settlement: Rent, utilities, furniture, moving costs, first month expenses
- financial: Bank fees, money transfers, exchange fees, credit checks, financial services
- miscellaneous: Other migration-related expenses not fitting above categories

TRANSACTIONS:
${transactions.map((t, i) => `${i + 1}. ${t.description} - ${t.amount}`).join('\n')}

Return a JSON array with this exact structure (no markdown formatting):
[
  {
    "index": 0,
    "category": "visaImmigration",
    "confidence": 95,
    "reason": "Embassy visa application fee"
  }
]

Rules:
- Index matches the transaction number (0-based)
- Confidence: 0-100 (higher = more certain)
- Reason: Brief explanation for categorization
- Only return valid JSON, no additional text`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
                      responseText.match(/(\[[\s\S]*?\])/);

    if (!jsonMatch) {
      console.error("Failed to extract JSON from Gemini response:", responseText);
      // Fallback to miscellaneous category
      return transactions.map(t => ({
        ...t,
        category: "miscellaneous" as const,
        confidence: 50,
        reason: "Failed to categorize - defaulted to miscellaneous"
      }));
    }

    const categories = JSON.parse(jsonMatch[1]);

    // Map categories to transactions
    return transactions.map((transaction, index) => {
      const category = categories.find((c: any) => c.index === index);

      if (!category) {
        return {
          ...transaction,
          category: "miscellaneous" as const,
          confidence: 50,
          reason: "No category returned by AI"
        };
      }

      return {
        ...transaction,
        category: category.category,
        confidence: category.confidence,
        reason: category.reason
      };
    });
  } catch (error) {
    console.error("Gemini categorization error:", error);
    // Fallback to miscellaneous category on error
    return transactions.map(t => ({
      ...t,
      category: "miscellaneous" as const,
      confidence: 50,
      reason: "AI categorization failed - defaulted to miscellaneous"
    }));
  }
}
