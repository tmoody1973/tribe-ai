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
  })
    .index("by_corridor", ["corridorId"])
    .index("by_status", ["corridorId", "status"])
    .index("by_category", ["corridorId", "category"]),

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
});
