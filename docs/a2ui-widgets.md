# TRIBE A2UI Widget Specifications

This document defines declarative UI widget specifications for CopilotKit's A2UI Composer integration. These widgets enable Mastra agents to render structured UI components without hardcoding UI logic.

**Reference:** [CopilotKit A2UI Composer](https://composer.copilotkit.ai/)

---

## Architecture Overview

TRIBE uses the **Mastra + CopilotKit** integration pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     TRIBE A2UI Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User Query → CopilotKit Runtime → Mastra Agent            │
│                        ↓                                     │
│            Agent returns widget spec (JSON)                  │
│                        ↓                                     │
│         CopilotKit renders React component                   │
│                        ↓                                     │
│              User sees styled UI card                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget Specifications

### 1. ProtocolCard Widget

**Purpose:** Display a single migration protocol step with category, priority, warnings, and tips.

**Agent Action Name:** `showProtocolCard`

**Widget Schema:**
```json
{
  "widget": "ProtocolCard",
  "props": {
    "protocol": {
      "category": "visa | finance | housing | employment | legal | health | social",
      "title": "string - protocol step title",
      "description": "string - detailed description of the step",
      "priority": "critical | high | medium | low",
      "order": "number - step sequence (1-based)",
      "warnings": ["string - critical warnings for this step"],
      "hacks": ["string - insider tips and shortcuts"],
      "confidence": "number (0-1) - agent confidence in this information",
      "attribution": {
        "sourceUrl": "string - source URL",
        "authorName": "string - source author/organization",
        "engagement": "number - community engagement score"
      }
    },
    "emphasis": "high | medium | low - based on user's migration stage",
    "isStreaming": "boolean - true while content is being generated"
  }
}
```

**Example Agent Call:**
```typescript
// Agent generates this for A2UI Composer
{
  widget: "ProtocolCard",
  props: {
    protocol: {
      category: "visa",
      title: "Apply for Work Visa (H-1B)",
      description: "Submit your H-1B visa application through USCIS. This is typically done by your sponsoring employer.",
      priority: "critical",
      order: 1,
      warnings: [
        "H-1B cap is reached quickly - apply in first week of April",
        "Premium processing adds $2,805 but reduces wait from 6 months to 15 days"
      ],
      hacks: [
        "Have employer file multiple petitions if cap-exempt university option exists",
        "Canadian citizens can use TN visa as faster alternative"
      ],
      confidence: 0.92,
      attribution: {
        sourceUrl: "https://www.uscis.gov/h-1b",
        authorName: "USCIS Official",
        engagement: 1500
      }
    },
    emphasis: "high"
  }
}
```

---

### 2. ProgressTracker Widget

**Purpose:** Display user's overall progress across all protocol categories.

**Agent Action Name:** `showProgressTracker`

**Widget Schema:**
```json
{
  "widget": "ProgressTracker",
  "props": {
    "corridorId": "string - Convex corridor ID",
    "stats": {
      "total": "number - total protocol steps",
      "completed": "number - completed steps",
      "inProgress": "number - steps in progress",
      "blocked": "number - blocked steps"
    },
    "categoryProgress": [
      {
        "category": "visa | finance | housing | employment | legal | health | social",
        "completed": "number",
        "total": "number"
      }
    ],
    "showConfetti": "boolean - trigger celebration animation"
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "ProgressTracker",
  props: {
    corridorId: "corridor123",
    stats: {
      total: 24,
      completed: 8,
      inProgress: 3,
      blocked: 1
    },
    categoryProgress: [
      { category: "visa", completed: 2, total: 4 },
      { category: "finance", completed: 3, total: 5 },
      { category: "housing", completed: 1, total: 4 },
      { category: "employment", completed: 2, total: 5 },
      { category: "legal", completed: 0, total: 2 },
      { category: "health", completed: 0, total: 2 },
      { category: "social", completed: 0, total: 2 }
    ],
    showConfetti: true
  }
}
```

---

### 3. WarningAlert Widget

**Purpose:** Display urgent warnings or time-sensitive information prominently.

**Agent Action Name:** `showWarningAlert`

**Widget Schema:**
```json
{
  "widget": "WarningAlert",
  "props": {
    "severity": "critical | warning | info",
    "title": "string - alert headline",
    "message": "string - detailed warning message",
    "deadline": "ISO date string | null - time-sensitive deadline",
    "actionLabel": "string - CTA button text",
    "actionUrl": "string - link for more info",
    "dismissible": "boolean - can user dismiss this alert"
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "WarningAlert",
  props: {
    severity: "critical",
    title: "H-1B Cap Window Opening Soon",
    message: "The H-1B lottery registration period opens April 1st. Ensure your employer has all documents ready.",
    deadline: "2025-04-01T00:00:00Z",
    actionLabel: "View Checklist",
    actionUrl: "/dashboard/protocols?category=visa",
    dismissible: false
  }
}
```

---

### 4. SourceAttribution Widget

**Purpose:** Display community source with engagement metrics and verification status.

**Agent Action Name:** `showSourceAttribution`

**Widget Schema:**
```json
{
  "widget": "SourceAttribution",
  "props": {
    "source": {
      "url": "string - source URL",
      "title": "string - source title",
      "author": "string - author name or handle",
      "platform": "reddit | forum | blog | government | news",
      "publishedAt": "ISO date string",
      "engagement": {
        "upvotes": "number",
        "comments": "number",
        "shares": "number"
      }
    },
    "verification": {
      "status": "verified | community | unverified",
      "verifiedBy": "string - verifier name (e.g., 'TRIBE Community')",
      "verifiedAt": "ISO date string"
    },
    "relevanceScore": "number (0-1) - how relevant to user's query"
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "SourceAttribution",
  props: {
    source: {
      url: "https://reddit.com/r/immigration/comments/abc123",
      title: "My H-1B journey from India to US - Complete Timeline",
      author: "u/TechMigrant2024",
      platform: "reddit",
      publishedAt: "2024-11-15T10:30:00Z",
      engagement: {
        upvotes: 892,
        comments: 156,
        shares: 45
      }
    },
    verification: {
      status: "community",
      verifiedBy: "TRIBE Community",
      verifiedAt: "2024-11-20T14:00:00Z"
    },
    relevanceScore: 0.94
  }
}
```

---

### 5. CulturalCard Widget

**Purpose:** Display shareable cultural education cards for user's background.

**Agent Action Name:** `showCulturalCard`

**Widget Schema:**
```json
{
  "widget": "CulturalCard",
  "props": {
    "variant": "neighbors | coworkers | schools | general",
    "title": "string - card title",
    "culture": "string - culture being explained (e.g., 'Nigerian Yoruba')",
    "content": {
      "greeting": "string - how to greet appropriately",
      "communication": "string - communication style notes",
      "food": "string - dietary preferences and food culture",
      "holidays": "string - important celebrations",
      "whatToKnow": "string - key things to understand"
    },
    "language": "string - language code this card is in",
    "shareUrl": "string | null - shareable URL for this card"
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "CulturalCard",
  props: {
    variant: "coworkers",
    title: "Working with Oluwaseun",
    culture: "Nigerian Yoruba",
    content: {
      greeting: "A warm 'E kaaro' (Good morning) or 'E kaasan' (Good afternoon) is appreciated. Handshakes are common in professional settings.",
      communication: "Direct communication is valued in work contexts. Respect for hierarchy and elders is important - use titles like 'Sir' or 'Ma' with senior colleagues.",
      food: "May observe Ramadan if Muslim. Enjoys spicy foods. Jollof rice is a beloved dish - never compare it unfavorably to Ghanaian jollof!",
      holidays: "Major celebrations include Eid (if Muslim), Christmas, and traditional festivals like Osun-Osogbo in August.",
      whatToKnow: "Family is central - asking about family shows care. 'African time' is a stereotype to avoid; many Nigerians are highly punctual in professional settings."
    },
    language: "en",
    shareUrl: "https://tribe.ai/cards/abc123"
  }
}
```

---

### 6. LocalCustom Widget

**Purpose:** Explain destination country customs with cultural context.

**Agent Action Name:** `showLocalCustom`

**Widget Schema:**
```json
{
  "widget": "LocalCustom",
  "props": {
    "custom": {
      "country": "string - destination country",
      "category": "workplace | social | dining | relationships | public | holidays",
      "title": "string - custom name",
      "description": "string - what the custom is",
      "whyExplanation": "string - cultural/historical context",
      "doTips": ["string - things TO do"],
      "dontTips": ["string - things NOT to do"],
      "recoveryPhrases": ["string - what to say if you make a mistake"]
    },
    "relativeContext": "string - how this differs from user's origin culture"
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "LocalCustom",
  props: {
    custom: {
      country: "Germany",
      category: "workplace",
      title: "Punctuality (Pünktlichkeit)",
      description: "Arriving on time - or 5 minutes early - is considered essential in German professional culture.",
      whyExplanation: "German culture values efficiency and reliability. Being late signals disrespect for others' time and poor planning.",
      doTips: [
        "Arrive 5 minutes early for meetings",
        "If running late, call ahead immediately",
        "Plan for traffic and transit delays"
      ],
      dontTips: [
        "Don't use 'African time' or 'flexible timing' jokes",
        "Don't arrive more than 10 minutes early (it's also awkward)",
        "Don't make excuses - just apologize briefly and move on"
      ],
      recoveryPhrases: [
        "Es tut mir leid für die Verspätung (I'm sorry for the delay)",
        "Entschuldigung, ich hatte [reason] (Sorry, I had [reason])"
      ]
    },
    relativeContext: "This may feel more rigid than Nigerian work culture, where relationships sometimes take precedence over strict schedules. In Germany, being on time IS showing respect."
  }
}
```

---

### 7. MicroMoment Widget

**Purpose:** Decode confusing social situations in real-time.

**Agent Action Name:** `showMicroMoment`

**Widget Schema:**
```json
{
  "widget": "MicroMoment",
  "props": {
    "situation": "string - user's description of the confusing moment",
    "interpretation": {
      "whatHappened": "string - factual explanation",
      "whyItHappened": "string - cultural context",
      "howToRespond": "string - recommended response",
      "normalizeMessage": "string - reassurance that adjustment is normal"
    },
    "culturalGap": {
      "originPerspective": "string - how this would be interpreted in origin culture",
      "destinationPerspective": "string - how it's meant in destination culture"
    }
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "MicroMoment",
  props: {
    situation: "My German colleague said 'That's an interesting idea' to my proposal and then moved on. I can't tell if they liked it or hated it.",
    interpretation: {
      whatHappened: "Your colleague gave neutral acknowledgment without committing to support or criticism.",
      whyItHappened: "In German communication, 'interesting' is often neutral - neither positive nor negative. Germans tend to be direct, so if they disliked it, they'd usually say so.",
      howToRespond: "Follow up directly: 'Would you like me to develop this further?' or 'Do you see any issues with this approach?' Germans appreciate direct questions.",
      normalizeMessage: "This ambiguity is confusing for many newcomers! German directness paradoxically makes neutral responses feel mysterious."
    },
    culturalGap: {
      originPerspective: "In Nigerian culture, 'interesting' often signals polite disagreement or a way to avoid saying no directly.",
      destinationPerspective: "In German culture, it genuinely means 'worth thinking about' - neither enthusiasm nor rejection."
    }
  }
}
```

---

### 8. BelongingMilestone Widget

**Purpose:** Track integration milestones and belonging journey.

**Agent Action Name:** `showBelongingMilestone`

**Widget Schema:**
```json
{
  "widget": "BelongingMilestone",
  "props": {
    "milestone": {
      "category": "social | cultural | knowledge | community",
      "title": "string - milestone name",
      "description": "string - what this milestone means",
      "isCompleted": "boolean",
      "completedAt": "ISO date string | null",
      "points": "number - contribution to belonging score"
    },
    "celebration": {
      "message": "string - congratulatory message",
      "nextSuggestion": "string - what to try next"
    }
  }
}
```

**Example Agent Call:**
```typescript
{
  widget: "BelongingMilestone",
  props: {
    milestone: {
      category: "social",
      title: "Made a Local Friend",
      description: "Built a genuine friendship with someone from your new country",
      isCompleted: true,
      completedAt: "2025-01-15T18:30:00Z",
      points: 25
    },
    celebration: {
      message: "This is huge! Local friendships are the foundation of feeling at home. You're building real roots here.",
      nextSuggestion: "Consider inviting them to experience something from your culture - cooking a meal together is a great way to deepen the friendship."
    }
  }
}
```

---

## Integration Guide

### Registering Widgets with CopilotKit

```typescript
// hooks/useTribeWidgets.ts
import { useCopilotAction } from "@copilotkit/react-core";
import { ProtocolCard } from "@/components/protocol/GenerativeProtocolCard";
import { ProgressTracker } from "@/components/protocol/ProgressBar";
import { WarningAlert } from "@/components/ui/WarningAlert";
import { SourceAttribution } from "@/components/protocol/SourceAttribution";
import { CulturalCard } from "@/components/cultural/CulturalCard";
import { LocalCustom } from "@/components/cultural/LocalCustomCard";
import { MicroMoment } from "@/components/cultural/MicroMomentCard";
import { BelongingMilestone } from "@/components/cultural/MilestoneCard";

export function useTribeWidgets() {
  // Register all A2UI widgets
  useCopilotAction({
    name: "showProtocolCard",
    description: "Display a migration protocol step card",
    parameters: [{ name: "protocol", type: "object" }, { name: "emphasis", type: "string" }],
    render: ({ args }) => <ProtocolCard {...args} />,
  });

  useCopilotAction({
    name: "showProgressTracker",
    description: "Display progress across protocol categories",
    parameters: [{ name: "stats", type: "object" }, { name: "categoryProgress", type: "array" }],
    render: ({ args }) => <ProgressTracker {...args} />,
  });

  useCopilotAction({
    name: "showWarningAlert",
    description: "Display urgent warning or time-sensitive alert",
    parameters: [{ name: "severity", type: "string" }, { name: "title", type: "string" }, { name: "message", type: "string" }],
    render: ({ args }) => <WarningAlert {...args} />,
  });

  useCopilotAction({
    name: "showSourceAttribution",
    description: "Display source with engagement metrics",
    parameters: [{ name: "source", type: "object" }, { name: "verification", type: "object" }],
    render: ({ args }) => <SourceAttribution {...args} />,
  });

  useCopilotAction({
    name: "showCulturalCard",
    description: "Display shareable cultural education card",
    parameters: [{ name: "variant", type: "string" }, { name: "content", type: "object" }],
    render: ({ args }) => <CulturalCard {...args} />,
  });

  useCopilotAction({
    name: "showLocalCustom",
    description: "Explain destination country customs",
    parameters: [{ name: "custom", type: "object" }, { name: "relativeContext", type: "string" }],
    render: ({ args }) => <LocalCustom {...args} />,
  });

  useCopilotAction({
    name: "showMicroMoment",
    description: "Decode confusing social situation",
    parameters: [{ name: "situation", type: "string" }, { name: "interpretation", type: "object" }],
    render: ({ args }) => <MicroMoment {...args} />,
  });

  useCopilotAction({
    name: "showBelongingMilestone",
    description: "Display belonging journey milestone",
    parameters: [{ name: "milestone", type: "object" }, { name: "celebration", type: "object" }],
    render: ({ args }) => <BelongingMilestone {...args} />,
  });
}
```

### Mastra Agent Integration

```typescript
// agents/protocolAdvisor.ts (updated for A2UI)
import { Agent } from "@mastra/core";

export const protocolAdvisor = new Agent({
  name: "ProtocolAdvisor",
  model: "gemini-3-flash-preview",
  instructions: `You are a migration preparation advisor for TRIBE.

When providing protocol guidance, use these A2UI widgets:
- showProtocolCard: For individual protocol steps
- showProgressTracker: To show user's overall progress
- showWarningAlert: For urgent deadlines or critical warnings
- showSourceAttribution: When citing community sources

Always structure your output to trigger appropriate widgets.
Return widget specifications as structured JSON that CopilotKit can render.`,
  tools: [],
});
```

---

## Styling Guidelines

All widgets must follow TRIBE's RetroUI design system:

```css
/* Base card styles */
.tribe-widget {
  border: 4px solid black;
  box-shadow: 4px 4px 0 0 black;
  transition: all 0.2s;
}

/* Category colors */
.category-visa { border-left: 8px solid #a855f7; background: #faf5ff; }
.category-finance { border-left: 8px solid #22c55e; background: #f0fdf4; }
.category-housing { border-left: 8px solid #3b82f6; background: #eff6ff; }
.category-employment { border-left: 8px solid #f97316; background: #fff7ed; }
.category-legal { border-left: 8px solid #ef4444; background: #fef2f2; }
.category-health { border-left: 8px solid #ec4899; background: #fdf2f8; }
.category-social { border-left: 8px solid #06b6d4; background: #ecfeff; }

/* Priority badges */
.priority-critical { background: #ef4444; color: white; }
.priority-high { background: #f97316; color: white; }
.priority-medium { background: #facc15; color: black; }
.priority-low { background: #d1d5db; color: black; }
```

---

## Future Widgets (Roadmap)

- **QuickStat Widget**: Display single corridor statistic
- **TimelineView Widget**: Show migration journey timeline
- **ComparisonCard Widget**: Compare two countries/options
- **ChecklistWidget**: Interactive todo list for protocol steps
- **MapPin Widget**: Show relevant locations on corridor map

---

*Document created for CopilotKit A2UI Composer integration*
*Reference: https://composer.copilotkit.ai/*
