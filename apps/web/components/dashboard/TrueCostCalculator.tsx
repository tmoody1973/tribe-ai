"use client";

import { useState, useMemo } from "react";
import { Calculator, ChevronRight, DollarSign, Plane, Home, Utensils, Shield, FileText, TrendingUp } from "lucide-react";

interface TrueCostCalculatorProps {
  destination: string;
  origin: string;
}

interface CostBreakdown {
  category: string;
  icon: React.ReactNode;
  items: { name: string; amount: number; note?: string }[];
  subtotal: number;
}

// Approximate costs by country (simplified)
const countryCosts: Record<string, { rent: number; food: number; transport: number; flight: number }> = {
  "United States": { rent: 2000, food: 600, transport: 150, flight: 800 },
  "United Kingdom": { rent: 1800, food: 500, transport: 180, flight: 600 },
  "Canada": { rent: 1600, food: 450, transport: 120, flight: 700 },
  "Australia": { rent: 1800, food: 500, transport: 150, flight: 1200 },
  "Germany": { rent: 1200, food: 400, transport: 100, flight: 500 },
  "France": { rent: 1400, food: 450, transport: 80, flight: 500 },
  "Netherlands": { rent: 1500, food: 400, transport: 100, flight: 500 },
  "Ireland": { rent: 1800, food: 450, transport: 120, flight: 550 },
  "New Zealand": { rent: 1400, food: 450, transport: 100, flight: 1300 },
  "Singapore": { rent: 2200, food: 400, transport: 100, flight: 900 },
  "Japan": { rent: 1200, food: 500, transport: 80, flight: 1000 },
  "South Korea": { rent: 1000, food: 400, transport: 60, flight: 900 },
  "United Arab Emirates": { rent: 1800, food: 500, transport: 150, flight: 600 },
};

const defaultCosts = { rent: 1500, food: 450, transport: 120, flight: 800 };

export function TrueCostCalculator({ destination, origin }: TrueCostCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [months, setMonths] = useState(3);
  const [includeFamily, setIncludeFamily] = useState(false);
  const [visaType, setVisaType] = useState("work");

  const costs = countryCosts[destination] || defaultCosts;

  const breakdown = useMemo((): CostBreakdown[] => {
    const familyMultiplier = includeFamily ? 1.7 : 1;

    // Visa costs by type
    const visaCosts: Record<string, number> = {
      work: 2500,
      skilled: 4500,
      student: 1500,
      family: 3000,
    };

    return [
      {
        category: "Before You Leave",
        icon: <FileText size={18} />,
        items: [
          { name: "Visa application fee", amount: visaCosts[visaType], note: "Government fee" },
          { name: "Health examination", amount: 300, note: "Required for most visas" },
          { name: "Police clearance", amount: 50 },
          { name: "Document translation", amount: 200 },
          { name: "Skills assessment", amount: visaType === "skilled" ? 500 : 0 },
        ].filter(i => i.amount > 0),
        subtotal: 0,
      },
      {
        category: "Travel",
        icon: <Plane size={18} />,
        items: [
          { name: `Flight from ${origin}`, amount: costs.flight * familyMultiplier },
          { name: "Excess baggage (2 bags)", amount: 200 * familyMultiplier },
          { name: "Travel insurance (1 month)", amount: 100 * familyMultiplier },
        ],
        subtotal: 0,
      },
      {
        category: "First Month Setup",
        icon: <Home size={18} />,
        items: [
          { name: "Temporary accommodation (2 weeks)", amount: costs.rent * 0.75, note: "Airbnb/hotel" },
          { name: "Rental deposit (usually 4-6 weeks)", amount: costs.rent * 1.5 },
          { name: "First month rent", amount: costs.rent * familyMultiplier },
          { name: "Furniture & basics", amount: 800 * familyMultiplier },
          { name: "SIM card & phone setup", amount: 50 },
        ],
        subtotal: 0,
      },
      {
        category: `Living Costs (${months} months)`,
        icon: <Utensils size={18} />,
        items: [
          { name: "Rent", amount: costs.rent * months * familyMultiplier },
          { name: "Food & groceries", amount: costs.food * months * familyMultiplier },
          { name: "Transport", amount: costs.transport * months * familyMultiplier },
          { name: "Utilities & internet", amount: 150 * months },
          { name: "Personal expenses", amount: 200 * months * familyMultiplier },
        ],
        subtotal: 0,
      },
      {
        category: "Emergency Fund",
        icon: <Shield size={18} />,
        items: [
          { name: "Emergency reserve (2 months expenses)", amount: (costs.rent + costs.food + costs.transport + 350) * 2 * familyMultiplier, note: "Highly recommended" },
        ],
        subtotal: 0,
      },
    ].map(cat => ({
      ...cat,
      subtotal: cat.items.reduce((sum, item) => sum + item.amount, 0),
    }));
  }, [destination, origin, months, includeFamily, visaType, costs]);

  const totalCost = breakdown.reduce((sum, cat) => sum + cat.subtotal, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 border-2 border-black flex items-center justify-center">
            <Calculator className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">True Cost Calculator</h3>
            <p className="text-sm text-gray-600">How much do you really need?</p>
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
          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold mb-1">Runway (months)</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full p-2 border-2 border-black"
              >
                <option value={2}>2 months</option>
                <option value={3}>3 months (recommended)</option>
                <option value={6}>6 months (safe)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Visa Type</label>
              <select
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className="w-full p-2 border-2 border-black"
              >
                <option value="work">Work Visa</option>
                <option value="skilled">Skilled Migration</option>
                <option value="student">Student Visa</option>
                <option value="family">Family Visa</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFamily}
                  onChange={(e) => setIncludeFamily(e.target.checked)}
                  className="w-5 h-5 border-2 border-black"
                />
                <span className="font-bold">Include family</span>
              </label>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4">
            {breakdown.map((category, index) => (
              <div key={index} className="border-2 border-black">
                <div className="flex items-center justify-between p-3 bg-gray-100 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <span className="font-bold">{category.category}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(category.subtotal)}</span>
                </div>
                <div className="p-3 space-y-2">
                  {category.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <span>{item.name}</span>
                        {item.note && (
                          <span className="text-gray-500 ml-2 text-xs">({item.note})</span>
                        )}
                      </div>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 p-4 bg-green-500 border-4 border-black">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <DollarSign size={24} />
                <span className="text-xl font-bold">TOTAL NEEDED</span>
              </div>
              <span className="text-3xl font-black">{formatCurrency(totalCost)}</span>
            </div>
            <p className="text-green-100 text-sm mt-2">
              This covers visa, travel, setup, {months} months living, and emergency fund
            </p>
          </div>

          {/* Savings Check */}
          <div className="mt-4 p-3 bg-yellow-100 border-2 border-yellow-500">
            <div className="flex items-start gap-2">
              <TrendingUp size={18} className="text-yellow-700 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-yellow-800">Pro Tip</p>
                <p className="text-yellow-700">
                  Start saving {formatCurrency(totalCost / 12)} per month to be ready in 1 year,
                  or {formatCurrency(totalCost / 6)} per month for 6 months.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
