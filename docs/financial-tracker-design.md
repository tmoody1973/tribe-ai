# Financial Tracker Design - Migration Budget & Currency Exchange

## 🎯 PURPOSE

Help migrants track complex multi-currency expenses across visa fees, travel, documents, settlement costs with real-time exchange rates and budget planning.

---

## 💰 KEY FEATURES

### 1. **Multi-Currency Support**
- Origin Currency (e.g., NGN, INR, PHP)
- Destination Currency (e.g., CAD, USD, GBP, EUR)
- Real-time exchange rates (update daily)
- Historical rate tracking ("You saved $240 by exchanging early!")

### 2. **Expense Categories**
```
📋 VISA & IMMIGRATION
- Application fees
- Biometrics
- Medical examination
- Police certificates
- Document translations
- Immigration consultant fees

🎓 TESTS & QUALIFICATIONS
- Language tests (IELTS, CELPIP, TEF, etc.)
- Educational credential assessment (WES, IQAS, etc.)
- Professional licensing exams

✈️ TRAVEL
- Flight tickets
- Temporary accommodation (AirBnB, hotels)
- Travel insurance
- Luggage/shipping

🏠 SETTLEMENT
- First month rent + deposit
- Furniture & essentials
- Phone/internet setup
- Transportation (transit pass, bike, car)
- Initial groceries

💳 FINANCIAL SETUP
- Bank account opening fees
- Credit card deposit
- International money transfer fees

📱 MISCELLANEOUS
- Passport renewal
- Courier services
- Photocopies & printing
- Emergency fund
```

### 3. **Budget Planning**
- Corridor-specific templates (e.g., "Nigeria → Canada typical: $8,500")
- Custom budget creation
- Category-wise allocation
- Timeline-based forecasting

### 4. **Smart Insights**
- Spending pace vs timeline
- Currency exchange recommendations
- Cost-saving tips from community
- Upcoming expense alerts

---

## 🎨 UI/UX DESIGN (Neo-Brutalism Style)

### **Main Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│  💰 MIGRATION BUDGET TRACKER                            │
│  Nigeria 🇳🇬 → Canada 🇨🇦                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 TOTAL BUDGET PROGRESS                              │
│  ┌───────────────────────────────────────────────┐    │
│  │  Spent: ₦920,000  =  CAD $3,200  (38%)        │    │
│  │  █████████░░░░░░░░░░░░░                       │    │
│  │  Remaining: ₦1,540,000  =  CAD $5,300         │    │
│  │  Total Budget: ₦2,460,000  =  CAD $8,500      │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  💡 Status: ON TRACK                                   │
│  You're 38% through budget, 42% through timeline       │
│  At this pace, you'll save $240 by arrival             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💱 EXCHANGE RATE TRACKER                              │
│  ┌───────────────────────────────────────────────┐    │
│  │  1 CAD = ₦287.65   📈 +2.3% this week         │    │
│  │  Last updated: 2 hours ago                     │    │
│  │                                                 │    │
│  │  Your average rate: ₦285.20 per CAD           │    │
│  │  💡 TIP: Exchange now! Rate is favorable       │    │
│  │                                                 │    │
│  │  [📊 View Rate History]  [🔔 Set Alert]       │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📋 EXPENSES BY CATEGORY                               │
│  ┌─────────────────────────────────────────┐          │
│  │ 📋 Visa & Immigration  ₦450,000 / ₦520,000     │    │
│  │ █████████████████░░░░  87%                     │    │
│  │ ✅ Medical exam, Police cert, Translations     │    │
│  │ ⏳ Pending: Visa application fee (₦85,000)     │    │
│  │                                                 │    │
│  │ 🎓 Tests  ₦90,000 / ₦130,000                   │    │
│  │ ██████████████░░░░░░  69%                      │    │
│  │ ✅ IELTS test                                   │    │
│  │ ⏳ Pending: WES evaluation (₦40,000)           │    │
│  │                                                 │    │
│  │ ✈️ Travel  ₦0 / ₦380,000                       │    │
│  │ ░░░░░░░░░░░░░░░░░░░░  0%                       │    │
│  │ ⏰ Not yet started (planned for Mar 2025)     │    │
│  │                                                 │    │
│  │ 🏠 Settlement  ₦380,000 / ₦1,200,000           │    │
│  │ ████████░░░░░░░░░░░░  32%                      │    │
│  │ ✅ Rent deposit saved                           │    │
│  │ ⏳ Pending: Furniture fund (₦820,000)          │    │
│  │                                                 │    │
│  │ [View All Categories ▼]                        │    │
│  └─────────────────────────────────────────┘          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📅 UPCOMING EXPENSES (Next 30 Days)                   │
│  ┌─────────────────────────────────────────┐          │
│  │  🔴 DUE IN 5 DAYS                               │    │
│  │  IELTS Results (if retake needed)               │    │
│  │  ₦89,000  =  CAD $310                          │    │
│  │  [💰 Mark as Paid]  [📅 Reschedule]           │    │
│  │                                                 │    │
│  │  🟡 DUE IN 12 DAYS                              │    │
│  │  WES Educational Assessment                     │    │
│  │  ₦115,000  =  CAD $400                         │    │
│  │  [💰 Mark as Paid]  [📅 Reschedule]           │    │
│  │                                                 │    │
│  │  🟢 DUE IN 28 DAYS                              │    │
│  │  Visa Application Fee                           │    │
│  │  ₦85,000  =  CAD $295                          │    │
│  │  [💰 Mark as Paid]  [📅 Reschedule]           │    │
│  └─────────────────────────────────────────┘          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💡 SMART INSIGHTS                                     │
│  ┌─────────────────────────────────────────┐          │
│  │  🎯 You're spending 5% UNDER budget        │    │
│  │     Great job! You've saved ₦58,000 so far     │    │
│  │                                                 │    │
│  │  💱 Exchange Rate Tip                          │    │
│  │     CAD is up 2.3% this week - good time to    │    │
│  │     exchange your settlement fund (₦380k)      │    │
│  │     You'll save ~₦8,700 vs last week!          │    │
│  │                                                 │    │
│  │  👥 Community Tip                               │    │
│  │     47 users recommend translator Olumide for   │    │
│  │     document translation. Saves ~₦18,000        │    │
│  │     [📧 Get Contact]                            │    │
│  └─────────────────────────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘

[➕ Add Expense]  [📊 View Reports]  [📥 Download Budget]
```

---

### **Currency Exchange Widget**

```
┌─────────────────────────────────────────┐
│  💱 CURRENCY CONVERTER                  │
├─────────────────────────────────────────┤
│                                         │
│  From: NGN (Nigerian Naira) 🇳🇬         │
│  ┌─────────────────────┐               │
│  │  100,000           ₦ │               │
│  └─────────────────────┘               │
│           ↓↓↓                           │
│  To: CAD (Canadian Dollar) 🇨🇦          │
│  ┌─────────────────────┐               │
│  │  347.75          $ │               │
│  └─────────────────────┘               │
│                                         │
│  Rate: 1 CAD = ₦287.65                 │
│  📈 +2.3% from last week               │
│  ⏰ Updated 2 hours ago                 │
│                                         │
│  [🔄 Reverse]  [💾 Save to Budget]     │
│                                         │
│  ═══ RATE HISTORY ═══                  │
│  Today:     ₦287.65                    │
│  Yesterday: ₦285.20                    │
│  Last Week: ₦281.10                    │
│  Last Month: ₦279.50                   │
│                                         │
│  💡 RECOMMENDATION:                     │
│  Exchange now! Rate is 2.9% better     │
│  than your 30-day average.             │
│                                         │
│  [📊 View Full History]                │
│  [🔔 Set Rate Alert]                   │
└─────────────────────────────────────────┘
```

---

### **Add Expense Form**

```
┌─────────────────────────────────────────┐
│  ➕ ADD NEW EXPENSE                     │
├─────────────────────────────────────────┤
│                                         │
│  Expense Name *                         │
│  ┌─────────────────────────────┐       │
│  │  Medical Examination        │       │
│  └─────────────────────────────┘       │
│                                         │
│  Category *                             │
│  ┌─────────────────────────────┐       │
│  │  📋 Visa & Immigration  ▼   │       │
│  └─────────────────────────────┘       │
│                                         │
│  Amount & Currency *                    │
│  ┌─────────┐  ┌─────────────┐          │
│  │  250    │  │  CAD  ▼     │          │
│  └─────────┘  └─────────────┘          │
│  = ₦71,912 (at current rate)           │
│                                         │
│  Date Paid                              │
│  ┌─────────────────────────────┐       │
│  │  Jan 25, 2025           📅  │       │
│  └─────────────────────────────┘       │
│                                         │
│  Status                                 │
│  ◉ Paid    ○ Pending    ○ Planned      │
│                                         │
│  Notes (Optional)                       │
│  ┌─────────────────────────────┐       │
│  │  Immigration medical exam    │       │
│  │  with Dr. Okafor, Lagos      │       │
│  └─────────────────────────────┘       │
│                                         │
│  📎 Attach Receipt (Optional)           │
│  [📁 Upload File]                       │
│                                         │
├─────────────────────────────────────────┤
│  [💾 Save Expense]    [❌ Cancel]       │
└─────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### **1. Database Schema (Convex)**

```typescript
// packages/convex/schema.ts

financialBudgets: defineTable({
  userId: v.id("users"),
  corridorId: v.id("corridors"),

  // Currencies
  originCurrency: v.string(), // "NGN", "INR", "PHP"
  destinationCurrency: v.string(), // "CAD", "USD", "GBP"

  // Total budget
  totalBudgetOrigin: v.number(), // ₦2,460,000
  totalBudgetDestination: v.number(), // CAD $8,500
  createdExchangeRate: v.number(), // Rate when budget created

  // Category allocations (in destination currency)
  allocations: v.object({
    visaImmigration: v.number(),
    tests: v.number(),
    travel: v.number(),
    settlement: v.number(),
    financial: v.number(),
    miscellaneous: v.number(),
  }),

  createdAt: v.number(),
  updatedAt: v.number(),
}),

financialExpenses: defineTable({
  userId: v.id("users"),
  corridorId: v.id("corridors"),
  budgetId: v.id("financialBudgets"),

  // Expense details
  name: v.string(),
  category: v.union(
    v.literal("visaImmigration"),
    v.literal("tests"),
    v.literal("travel"),
    v.literal("settlement"),
    v.literal("financial"),
    v.literal("miscellaneous")
  ),

  // Amount
  amountPaid: v.number(),
  currency: v.string(),
  exchangeRate: v.number(), // Rate at time of payment
  amountInDestination: v.number(), // Converted amount

  // Status
  status: v.union(
    v.literal("paid"),
    v.literal("pending"),
    v.literal("planned")
  ),
  datePaid: v.optional(v.number()),
  dateDue: v.optional(v.number()),

  // Metadata
  notes: v.optional(v.string()),
  receiptUrl: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_budget", ["budgetId"])
.index("by_user_corridor", ["userId", "corridorId"])
.index("by_status", ["status"])
.index("by_date_due", ["dateDue"]),

currencyRates: defineTable({
  fromCurrency: v.string(),
  toCurrency: v.string(),
  rate: v.number(),
  source: v.string(), // "exchangerate-api.com", "fixer.io"
  timestamp: v.number(),
})
.index("by_pair", ["fromCurrency", "toCurrency"])
.index("by_timestamp", ["timestamp"]),
```

### **2. Exchange Rate API Integration**

```typescript
// app/api/exchange-rate/route.ts

import { NextRequest } from "next/server";

// Free API: https://exchangerate-api.com
// 1,500 requests/month free

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "USD";
  const to = searchParams.get("to") || "CAD";

  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );

    const data = await response.json();
    const rate = data.rates[to];

    return Response.json({
      from,
      to,
      rate,
      timestamp: Date.now(),
      source: "exchangerate-api.com",
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}
```

### **3. Daily Rate Update (Convex Cron)**

```typescript
// convex/crons.ts

// Daily exchange rate update (8 AM UTC)
crons.daily(
  "update exchange rates",
  { hourUTC: 8, minuteUTC: 0 },
  internal.financial.updateExchangeRates
);

// convex/financial.ts

export const updateExchangeRates = internalAction({
  args: {},
  handler: async (ctx) => {
    const commonPairs = [
      { from: "NGN", to: "CAD" },
      { from: "NGN", to: "USD" },
      { from: "INR", to: "CAD" },
      { from: "INR", to: "USD" },
      { from: "PHP", to: "CAD" },
      { from: "PHP", to: "USD" },
      // ... more pairs
    ];

    for (const pair of commonPairs) {
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${pair.from}`
        );
        const data = await response.json();
        const rate = data.rates[pair.to];

        await ctx.runMutation(internal.financial.saveExchangeRate, {
          fromCurrency: pair.from,
          toCurrency: pair.to,
          rate,
          source: "exchangerate-api.com",
        });
      } catch (error) {
        console.error(`Failed to update ${pair.from} → ${pair.to}:`, error);
      }
    }
  },
});
```

---

## 💡 INTEGRATION WITH BRIEFINGS

### **In Daily Briefing:**

```typescript
// convex/ai/briefings.ts

// Add financial data gathering
const financialData = await ctx.runQuery(api.financial.getBudgetSummary, {
  userId: profile._id,
  corridorId,
});

// In buildBriefingPrompt:
FINANCIAL UPDATE:
- Total spent: ${financialData.totalSpent} of ${financialData.totalBudget}
- Progress: ${financialData.percentageSpent}% spent, ${timelinePercent}% timeline
- Status: ${financialData.status} (ON TRACK / OVER BUDGET / UNDER BUDGET)
- Upcoming expenses (next 30 days): ${financialData.upcomingExpenses.map(e => e.name).join(", ")}
- Exchange rate tip: ${financialData.exchangeRateTip}
```

### **Generated Briefing Output:**

```
[FINANCIAL CHECK-IN - 20s] 💰
"Quick money update: You've saved CAD $3,200 of your $8,500 target.
That's 38% of your budget with 42% of your timeline complete - you're
slightly ahead!

At your current pace, you'll actually save $240 by the time you arrive.

Your biggest upcoming expense is the IELTS test at $310, due next week.

Pro tip: The Naira strengthened 2.3% against the Canadian dollar this week.
If you were planning to exchange your settlement fund of ₦380,000, now's
a good time - you'll save about ₦8,700 compared to last week's rate!"
```

---

## 📊 BUDGET TEMPLATES BY CORRIDOR

```typescript
// Pre-populated budgets based on corridor data

const BUDGET_TEMPLATES = {
  "Nigeria-Canada": {
    currency: "CAD",
    typical: 8500,
    breakdown: {
      visaImmigration: 1800,  // Express Entry, medical, police cert, translations
      tests: 450,             // IELTS, WES
      travel: 1300,           // Flight, temporary accommodation, insurance
      settlement: 4200,       // First 3 months rent, furniture, essentials
      financial: 500,         // Bank fees, transfers
      miscellaneous: 250,     // Misc, emergency buffer
    }
  },
  "India-USA": {
    currency: "USD",
    typical: 12000,
    breakdown: {
      visaImmigration: 2500,
      tests: 600,
      travel: 1800,
      settlement: 6000,
      financial: 800,
      miscellaneous: 300,
    }
  },
  // ... more templates
};
```

---

## 🎯 HACKATHON DEMO SCRIPT

```
[Show Financial Tracker]

"Migration is expensive. TRIBE helps users track every dollar.

[Open budget overview]

Sarah's migrating Nigeria → Canada. Total budget: $8,500.

[Point to progress bar]

She's spent $3,200 so far - that's 38% of budget.

[Point to status]

The tracker shows she's ON TRACK - spending pace matches timeline.

[Scroll to categories]

Expenses organized by category:
- Visa & Immigration: 87% complete
- Tests: 69% (waiting on WES results)
- Travel: 0% (planned for March)
- Settlement: 32% (rent deposit saved)

[Click currency converter]

Multi-currency support is critical. Sarah earns in Naira,
spends in Canadian dollars.

[Show exchange rate]

Real-time rates: 1 CAD = ₦287.65

[Point to recommendation]

The tracker noticed the Naira strengthened 2.3% this week.

It's recommending she exchange her settlement fund NOW to save ₦8,700.

[Click upcoming expenses]

Upcoming expenses with due dates:
- IELTS results: 5 days (if retake needed)
- WES assessment: 12 days
- Visa fee: 28 days

[Switch to briefing audio]

And here's the magic - this financial data feeds into her
daily briefing:

[Play financial section]

"You've saved CAD $3,200 of your $8,500 target. At your
current pace, you'll save $240 by arrival. The Naira
strengthened 2.3% - good time to exchange!"

[Final point]

Financial tracking isn't just data - it's intelligence that
helps users make smart money decisions during a stressful
process. Users who track expenses save 23% on average by
catching duplicates and finding cheaper alternatives."
```

---

## 📋 IMPLEMENTATION PRIORITY

1. **Phase 1 (MVP - 2 days)**
   - [ ] Database schema
   - [ ] Budget creation (manual amounts)
   - [ ] Expense tracking (add/edit/delete)
   - [ ] Basic dashboard with totals

2. **Phase 2 (Exchange Rates - 1 day)**
   - [ ] Exchange rate API integration
   - [ ] Currency converter widget
   - [ ] Daily rate updates (cron)
   - [ ] Rate history tracking

3. **Phase 3 (Smart Features - 1 day)**
   - [ ] Upcoming expenses section
   - [ ] Budget vs timeline comparison
   - [ ] Exchange rate recommendations
   - [ ] Category breakdown visualization

4. **Phase 4 (Briefing Integration - 0.5 days)**
   - [ ] Query financial data in briefings
   - [ ] Add financial section to daily briefing
   - [ ] Add financial deep dive to weekly briefing

---

## 🎨 VISUAL DESIGN NOTES

**Neo-Brutalism Elements:**
- Thick black borders (4px) on all cards
- Bold typography (font-weight: 900)
- Bright accent colors (yellow for savings, red for alerts, green for on-track)
- Shadow-box effect (shadow-[4px_4px_0_0_#000])
- High contrast (black text on white/colored backgrounds)

**Color Coding:**
- 🔴 RED: Over budget, urgent, due soon
- 🟡 YELLOW: Attention needed, pending
- 🟢 GREEN: On track, completed, favorable
- 🔵 BLUE: Informational, planned

**Responsive:**
- Mobile-first (most users check on phone)
- Touch-friendly buttons (min 44px height)
- Collapsible sections on mobile
- Sticky header with total budget
