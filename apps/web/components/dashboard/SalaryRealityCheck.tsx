"use client";

import { useState } from "react";
import { TrendingUp, ChevronRight, DollarSign, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";

interface SalaryRealityCheckProps {
  destination: string;
}

interface SalaryAnalysis {
  verdict: "good" | "fair" | "low" | "very_low";
  percentile: number;
  marketRange: { low: number; median: number; high: number };
  takeHomeEstimate: number;
  costOfLivingRatio: number;
  warnings: string[];
  positives: string[];
  recommendation: string;
}

// Average salaries by country and role (simplified, in USD)
const salaryData: Record<string, Record<string, { low: number; median: number; high: number }>> = {
  "United States": {
    tech: { low: 80000, median: 120000, high: 180000 },
    healthcare: { low: 60000, median: 85000, high: 130000 },
    finance: { low: 70000, median: 100000, high: 160000 },
    engineering: { low: 75000, median: 105000, high: 150000 },
    education: { low: 40000, median: 55000, high: 80000 },
    other: { low: 45000, median: 65000, high: 95000 },
  },
  "United Kingdom": {
    tech: { low: 45000, median: 70000, high: 110000 },
    healthcare: { low: 35000, median: 50000, high: 80000 },
    finance: { low: 50000, median: 75000, high: 120000 },
    engineering: { low: 40000, median: 60000, high: 90000 },
    education: { low: 30000, median: 42000, high: 65000 },
    other: { low: 30000, median: 45000, high: 70000 },
  },
  "Australia": {
    tech: { low: 70000, median: 100000, high: 150000 },
    healthcare: { low: 55000, median: 80000, high: 120000 },
    finance: { low: 65000, median: 95000, high: 140000 },
    engineering: { low: 70000, median: 95000, high: 135000 },
    education: { low: 50000, median: 70000, high: 100000 },
    other: { low: 50000, median: 70000, high: 100000 },
  },
  "Canada": {
    tech: { low: 60000, median: 90000, high: 140000 },
    healthcare: { low: 50000, median: 75000, high: 110000 },
    finance: { low: 55000, median: 85000, high: 130000 },
    engineering: { low: 60000, median: 85000, high: 120000 },
    education: { low: 45000, median: 65000, high: 90000 },
    other: { low: 40000, median: 60000, high: 85000 },
  },
  "Germany": {
    tech: { low: 50000, median: 70000, high: 100000 },
    healthcare: { low: 45000, median: 60000, high: 90000 },
    finance: { low: 55000, median: 75000, high: 110000 },
    engineering: { low: 50000, median: 70000, high: 100000 },
    education: { low: 40000, median: 55000, high: 75000 },
    other: { low: 35000, median: 50000, high: 75000 },
  },
};

const defaultSalaryData = {
  tech: { low: 50000, median: 75000, high: 120000 },
  healthcare: { low: 40000, median: 60000, high: 100000 },
  finance: { low: 45000, median: 70000, high: 110000 },
  engineering: { low: 45000, median: 70000, high: 100000 },
  education: { low: 35000, median: 50000, high: 75000 },
  other: { low: 35000, median: 55000, high: 80000 },
};

// Tax rates by country (simplified)
const taxRates: Record<string, number> = {
  "United States": 0.25,
  "United Kingdom": 0.28,
  "Australia": 0.30,
  "Canada": 0.27,
  "Germany": 0.35,
};

export function SalaryRealityCheck({ destination }: SalaryRealityCheckProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [salary, setSalary] = useState("");
  const [role, setRole] = useState("tech");
  const [analysis, setAnalysis] = useState<SalaryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSalary = async () => {
    setIsAnalyzing(true);

    // Simulate brief loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    const salaryNum = parseFloat(salary);
    const countryData = salaryData[destination] || defaultSalaryData;
    const roleData = countryData[role as keyof typeof countryData] || countryData.other;
    const taxRate = taxRates[destination] || 0.28;

    // Calculate percentile
    let percentile: number;
    if (salaryNum <= roleData.low) {
      percentile = Math.round((salaryNum / roleData.low) * 25);
    } else if (salaryNum <= roleData.median) {
      percentile = 25 + Math.round(((salaryNum - roleData.low) / (roleData.median - roleData.low)) * 25);
    } else if (salaryNum <= roleData.high) {
      percentile = 50 + Math.round(((salaryNum - roleData.median) / (roleData.high - roleData.median)) * 40);
    } else {
      percentile = 90 + Math.min(9, Math.round(((salaryNum - roleData.high) / roleData.high) * 10));
    }

    // Determine verdict
    let verdict: "good" | "fair" | "low" | "very_low";
    if (percentile >= 60) verdict = "good";
    else if (percentile >= 40) verdict = "fair";
    else if (percentile >= 20) verdict = "low";
    else verdict = "very_low";

    // Calculate take-home
    const takeHomeEstimate = salaryNum * (1 - taxRate);

    // Build warnings and positives
    const warnings: string[] = [];
    const positives: string[] = [];

    if (percentile < 25) {
      warnings.push("This salary is below market average for your role");
    }
    if (percentile < 40) {
      warnings.push("You may struggle with cost of living in major cities");
    }
    if (salaryNum < roleData.median * 0.7) {
      warnings.push("Consider negotiating or looking at other offers");
    }

    if (percentile >= 50) {
      positives.push("You're at or above the median for your role");
    }
    if (percentile >= 70) {
      positives.push("This is a competitive offer");
    }
    if (salaryNum >= roleData.high * 0.9) {
      positives.push("You're in the top tier for this role");
    }

    // Recommendation
    let recommendation: string;
    if (verdict === "good") {
      recommendation = "This is a solid offer. Make sure to negotiate benefits and equity too.";
    } else if (verdict === "fair") {
      recommendation = "This is acceptable but there may be room to negotiate. Research similar roles.";
    } else if (verdict === "low") {
      recommendation = "Consider negotiating or getting competing offers. This is below market rate.";
    } else {
      recommendation = "This offer is significantly below market. Strongly recommend exploring other options.";
    }

    setAnalysis({
      verdict,
      percentile,
      marketRange: roleData,
      takeHomeEstimate,
      costOfLivingRatio: takeHomeEstimate / 12 / (roleData.median / 12 * 0.4), // Rough ratio
      warnings,
      positives,
      recommendation,
    });

    setIsAnalyzing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const verdictColors = {
    good: "bg-green-500",
    fair: "bg-yellow-500",
    low: "bg-orange-500",
    very_low: "bg-red-500",
  };

  const verdictLabels = {
    good: "Good Offer",
    fair: "Fair Offer",
    low: "Below Market",
    very_low: "Low Offer",
  };

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 border-2 border-black flex items-center justify-center">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Salary Reality Check</h3>
            <p className="text-sm text-gray-600">Is your job offer fair?</p>
          </div>
        </div>
        <ChevronRight
          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
          size={20}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t-4 border-black p-4">
          {!analysis ? (
            <>
              {/* Input Form */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-sm mb-1">Your Offered Salary (Annual, USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g., 75000"
                      className="w-full pl-10 pr-4 py-3 border-2 border-black text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-sm mb-1">Your Field</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3 border-2 border-black"
                  >
                    <option value="tech">Technology / IT</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance / Business</option>
                    <option value="engineering">Engineering</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  onClick={analyzeSalary}
                  disabled={!salary || isAnalyzing}
                  className={`
                    w-full py-3 font-bold text-white border-2 border-black
                    shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-2
                    ${!salary ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={18} />
                      Check My Salary
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-4">
                {/* Verdict */}
                <div className={`${verdictColors[analysis.verdict]} text-white p-4 border-2 border-black text-center`}>
                  <p className="text-2xl font-black">{verdictLabels[analysis.verdict]}</p>
                  <p className="text-sm opacity-90">
                    Your offer is in the {analysis.percentile}th percentile for {destination}
                  </p>
                </div>

                {/* Market Comparison */}
                <div className="border-2 border-black p-4">
                  <h4 className="font-bold mb-3">Market Range for Your Role</h4>
                  <div className="relative h-8 bg-gray-200 border border-black">
                    {/* Range bar */}
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                      <div className="w-full h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 mx-4" />
                    </div>
                    {/* Your position marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-black"
                      style={{
                        left: `${Math.min(95, Math.max(5, analysis.percentile))}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 whitespace-nowrap">
                        You: {formatCurrency(parseFloat(salary))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>{formatCurrency(analysis.marketRange.low)}</span>
                    <span className="font-bold">{formatCurrency(analysis.marketRange.median)}</span>
                    <span>{formatCurrency(analysis.marketRange.high)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Entry</span>
                    <span>Median</span>
                    <span>Senior</span>
                  </div>
                </div>

                {/* Take-home estimate */}
                <div className="border-2 border-black p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Take-Home (after tax)</p>
                      <p className="text-2xl font-black">{formatCurrency(analysis.takeHomeEstimate)}/year</p>
                      <p className="text-sm text-gray-500">{formatCurrency(analysis.takeHomeEstimate / 12)}/month</p>
                    </div>
                    <Info size={24} className="text-gray-400" />
                  </div>
                </div>

                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div className="border-2 border-orange-500 bg-orange-50 p-3">
                    {analysis.warnings.map((warning, i) => (
                      <div key={i} className="flex items-start gap-2 text-orange-700">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Positives */}
                {analysis.positives.length > 0 && (
                  <div className="border-2 border-green-500 bg-green-50 p-3">
                    {analysis.positives.map((positive, i) => (
                      <div key={i} className="flex items-start gap-2 text-green-700">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{positive}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                <div className="border-2 border-black p-3 bg-blue-50">
                  <p className="font-bold text-sm mb-1">Our Recommendation</p>
                  <p className="text-sm">{analysis.recommendation}</p>
                </div>

                {/* Reset */}
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setSalary("");
                  }}
                  className="w-full py-2 border-2 border-black font-bold hover:bg-gray-100"
                >
                  Check Another Offer
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
