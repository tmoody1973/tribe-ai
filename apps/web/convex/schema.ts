import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    language: v.union(
      v.literal("en"),
      v.literal("yo"),
      v.literal("hi"),
      v.literal("pt"),
      v.literal("tl"),
      v.literal("ko"),
      v.literal("de"),
      v.literal("fr"),
      v.literal("es")
    ),
    originCountry: v.optional(v.string()),
    destinationCountry: v.optional(v.string()),
    stage: v.optional(
      v.union(
        v.literal("dreaming"),
        v.literal("planning"),
        v.literal("preparing"),
        v.literal("relocating"),
        v.literal("settling")
      )
    ),
    visaType: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    autoSpeak: v.optional(v.boolean()), // Auto-speak TTS responses
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  corridors: defineTable({
    userId: v.id("users"),
    origin: v.string(),
    destination: v.string(),
    stage: v.union(
      v.literal("dreaming"),
      v.literal("planning"),
      v.literal("preparing"),
      v.literal("relocating"),
      v.literal("settling")
    ),
    // Multi-journey support
    name: v.optional(v.string()), // User-defined name like "Berlin Option"
    isPrimary: v.optional(v.boolean()), // Active journey (only one per user)
    // Freshness tracking
    lastResearchedAt: v.optional(v.number()),
    researchStatus: v.optional(
      v.union(
        v.literal("fresh"),
        v.literal("stale"),
        v.literal("refreshing"),
        v.literal("error")
      )
    ),
    protocolCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_primary", ["userId", "isPrimary"])
    .index("by_corridor", ["origin", "destination"])
    .index("by_status", ["researchStatus"]),

  protocols: defineTable({
    corridorId: v.id("corridors"),
    category: v.union(
      v.literal("visa"),
      v.literal("finance"),
      v.literal("housing"),
      v.literal("employment"),
      v.literal("legal"),
      v.literal("health"),
      v.literal("social")
    ),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    warnings: v.optional(v.array(v.string())),
    hacks: v.optional(v.array(v.string())),
    attribution: v.optional(
      v.object({
        authorName: v.optional(v.string()),
        sourceUrl: v.string(),
        sourceDate: v.optional(v.number()),
        engagement: v.optional(v.number()),
      })
    ),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    aiGenerated: v.boolean(),
    order: v.number(),
    // Archive fields - track which stage generated this and soft delete
    generatedForStage: v.optional(
      v.union(
        v.literal("dreaming"),
        v.literal("planning"),
        v.literal("preparing"),
        v.literal("relocating"),
        v.literal("settling")
      )
    ),
    archived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    archivedReason: v.optional(v.string()), // "stage_change", "manual", "refresh"
  })
    .index("by_corridor", ["corridorId"])
    .index("by_status", ["corridorId", "status"])
    .index("by_category", ["corridorId", "category"])
    .index("by_archived", ["corridorId", "archived"])
    .index("by_stage", ["corridorId", "generatedForStage"]),

  // User-saved protocols - bookmarked items with personal notes
  savedProtocols: defineTable({
    userId: v.id("users"),
    corridorId: v.id("corridors"),
    originalProtocolId: v.optional(v.id("protocols")), // Reference to original (may be deleted)
    // Snapshot of protocol data at time of save
    snapshot: v.object({
      category: v.string(),
      title: v.string(),
      description: v.string(),
      priority: v.string(),
      status: v.string(),
      warnings: v.optional(v.array(v.string())),
      hacks: v.optional(v.array(v.string())),
      generatedForStage: v.optional(v.string()),
    }),
    // User's personal additions
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // User-defined tags
    savedAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_corridor", ["userId", "corridorId"])
    .index("by_original", ["originalProtocolId"]),

  ingestedContent: defineTable({
    corridorId: v.id("corridors"),
    url: v.string(),
    title: v.string(),
    content: v.string(),
    embedding: v.optional(v.array(v.float64())),
    source: v.union(
      v.literal("reddit"),
      v.literal("forum"),
      v.literal("blog"),
      v.literal("government"),
      v.literal("news")
    ),
    metadata: v.object({
      author: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      subreddit: v.optional(v.string()),
    }),
    scrapedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_corridor", ["corridorId"])
    .index("by_url", ["url"])
    .index("by_expiry", ["expiresAt"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["corridorId"],
    }),

  apiCache: defineTable({
    key: v.string(),
    data: v.any(),
    cachedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expiry", ["expiresAt"]),

  passportIndex: defineTable({
    origin: v.string(),
    destination: v.string(),
    requirement: v.string(),
  })
    .index("by_origin", ["origin"])
    .index("by_corridor", ["origin", "destination"]),

  metrics: defineTable({
    event: v.string(),
    corridorId: v.optional(v.id("corridors")),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_corridor", ["corridorId"])
    .index("by_time", ["createdAt"]),

  // User progress tracking for protocol completion
  userProgress: defineTable({
    userId: v.id("users"),
    corridorId: v.id("corridors"),
    protocolId: v.id("protocols"),
    completedAt: v.number(),
  })
    .index("by_user_corridor", ["userId", "corridorId"])
    .index("by_protocol", ["protocolId"]),

  // Chat message history for Q&A interface
  chatMessages: defineTable({
    userId: v.id("users"),
    corridorId: v.optional(v.id("corridors")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    metadata: v.optional(
      v.object({
        sources: v.optional(v.array(v.string())),
        model: v.optional(v.string()),
        tokens: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_corridor", ["userId", "corridorId"]),

  // Token usage logging for cost monitoring
  tokenUsage: defineTable({
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    action: v.string(),
    corridorId: v.optional(v.id("corridors")),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

  // Rate limiting for API calls (e.g., Perplexity)
  rateLimits: defineTable({
    userId: v.string(),
    action: v.string(),
    windowStart: v.number(),
    count: v.number(),
  })
    .index("by_user_action", ["userId", "action"])
    .index("by_window", ["windowStart"]),

  // Audio briefings for personalized migration updates
  briefings: defineTable({
    userId: v.id("users"),
    corridorId: v.id("corridors"),
    type: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("progress")
    ),
    script: v.string(),
    wordCount: v.number(),
    language: v.string(),
    context: v.object({
      stage: v.string(),
      completedSteps: v.number(),
      totalSteps: v.number(),
      recentCompletions: v.array(v.string()),
    }),
    // Audio fields for TTS
    audioStatus: v.optional(
      v.union(v.literal("pending"), v.literal("ready"), v.literal("failed"))
    ),
    audioStorageId: v.optional(v.id("_storage")),
    audioDuration: v.optional(v.number()), // seconds
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_corridor", ["userId", "corridorId"])
    .index("by_user_type", ["userId", "type"]),

  // Cultural profiles from AI-guided interview
  culturalProfiles: defineTable({
    userId: v.id("users"),
    originCulture: v.string(), // e.g., "Nigerian Yoruba"
    communicationStyle: v.union(
      v.literal("direct"),
      v.literal("indirect"),
      v.literal("context-dependent")
    ),
    familyStructure: v.union(
      v.literal("nuclear"),
      v.literal("extended"),
      v.literal("multi-generational")
    ),
    timeOrientation: v.union(
      v.literal("monochronic"),
      v.literal("polychronic")
    ),
    values: v.array(v.string()),
    foodDietary: v.array(v.string()),
    celebrations: v.array(v.string()),
    interviewResponses: v.any(), // Record<string, string>
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Document checklists for protocol steps
  documentChecklists: defineTable({
    protocolId: v.id("protocols"),
    corridorId: v.id("corridors"),
    userId: v.id("users"),
    documents: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        required: v.boolean(),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
        attachedDocumentId: v.optional(v.id("userDocuments")), // Link to uploaded file
      })
    ),
    generatedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_protocol", ["protocolId"])
    .index("by_user_corridor", ["userId", "corridorId"]),

  // User document vault - uploaded files (passport, certificates, etc.)
  userDocuments: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"), // Convex file storage
    fileName: v.string(), // Original filename
    fileType: v.string(), // MIME type
    fileSize: v.number(), // bytes
    category: v.union(
      v.literal("passport"),
      v.literal("visa"),
      v.literal("identity"),
      v.literal("education"),
      v.literal("employment"),
      v.literal("financial"),
      v.literal("medical"),
      v.literal("legal"),
      v.literal("other")
    ),
    displayName: v.string(), // User-editable name
    description: v.optional(v.string()),
    expiryDate: v.optional(v.number()), // For documents that expire
    issuedDate: v.optional(v.number()),
    issuingCountry: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // User-defined tags
    uploadedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_expiry", ["expiryDate"]),

  // Task Board (Kanban) - User action items
  tasks: defineTable({
    corridorId: v.id("corridors"),
    protocolStepId: v.optional(v.id("protocols")), // Optional link to protocol step
    title: v.string(),
    description: v.optional(v.string()),
    column: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("blocked"),
      v.literal("done")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    category: v.optional(
      v.union(
        v.literal("visa"),
        v.literal("finance"),
        v.literal("housing"),
        v.literal("employment"),
        v.literal("legal"),
        v.literal("health"),
        v.literal("social")
      )
    ),
    dueDate: v.optional(v.number()),
    order: v.number(), // Position within column for drag-drop
    notes: v.optional(v.string()), // User notes/comments
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_corridor", ["corridorId"])
    .index("by_corridor_column", ["corridorId", "column"])
    .index("by_protocol_step", ["protocolStepId"])
    .index("by_category", ["corridorId", "category"]),

  // Live corridor feed - real-time updates from Reddit, forums, news
  corridorFeed: defineTable({
    origin: v.string(),
    destination: v.string(),
    source: v.union(
      v.literal("reddit"),
      v.literal("forum"),
      v.literal("news"),
      v.literal("official")
    ),
    title: v.string(),
    snippet: v.string(),
    url: v.string(),
    author: v.optional(v.string()),
    subreddit: v.optional(v.string()),
    upvotes: v.optional(v.number()),
    comments: v.optional(v.number()),
    isAlert: v.optional(v.boolean()),
    alertType: v.optional(
      v.union(v.literal("opportunity"), v.literal("warning"), v.literal("update"))
    ),
    timestamp: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_corridor", ["origin", "destination"])
    .index("by_url", ["url"])
    .index("by_timestamp", ["timestamp"]),

  // Corridor statistics - migrant counts, success rates
  corridorStats: defineTable({
    origin: v.string(),
    destination: v.string(),
    activeUsers: v.number(),
    successfulMoves: v.number(),
    avgTimeToMove: v.optional(v.string()),
    lastUpdated: v.number(),
  })
    .index("by_corridor", ["origin", "destination"]),

  // Emergency info cache for destination countries
  emergencyInfo: defineTable({
    origin: v.string(), // Origin country (for embassy lookup)
    destination: v.string(), // Destination country
    // Emergency numbers
    emergencyNumber: v.string(),
    policeNumber: v.string(),
    ambulanceNumber: v.string(),
    fireNumber: v.string(),
    // Embassy/Consulate info (specific to origin country)
    embassy: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      email: v.string(),
      website: v.optional(v.string()),
      hours: v.optional(v.string()),
    }),
    // Emergency phrases in local language
    phrases: v.array(
      v.object({
        phrase: v.string(), // In local language
        meaning: v.string(), // English meaning
        pronunciation: v.optional(v.string()), // Phonetic guide
      })
    ),
    // Healthcare info
    healthcareInfo: v.string(),
    healthcareEmergency: v.optional(v.string()), // ER/hospital info
    // Support hotlines
    migrantHelpline: v.optional(v.string()),
    mentalHealthHotline: v.optional(v.string()),
    domesticViolenceHotline: v.optional(v.string()),
    // Additional resources
    localEmergencyApp: v.optional(v.string()), // e.g., "112 app" in EU
    insuranceInfo: v.optional(v.string()),
    // Metadata
    lastResearchedAt: v.number(),
    sourceUrls: v.optional(v.array(v.string())),
    confidence: v.optional(v.string()), // high, medium, low
  })
    .index("by_corridor", ["origin", "destination"])
    .index("by_destination", ["destination"]),

  // Translation cache for dynamic content
  translations: defineTable({
    hash: v.string(), // SHA256 hash of content + target locale
    originalText: v.string(),
    translatedText: v.string(),
    sourceLocale: v.string(),
    targetLocale: v.string(),
    charCount: v.number(), // For usage tracking
    createdAt: v.number(),
    expiresAt: v.number(), // TTL for cache invalidation
  })
    .index("by_hash", ["hash"])
    .index("by_expiry", ["expiresAt"])
    .index("by_locale_pair", ["sourceLocale", "targetLocale"]),
});
