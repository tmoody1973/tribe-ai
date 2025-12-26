import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const documentCategory = v.union(
  v.literal("passport"),
  v.literal("visa"),
  v.literal("identity"),
  v.literal("education"),
  v.literal("employment"),
  v.literal("financial"),
  v.literal("medical"),
  v.literal("legal"),
  v.literal("other")
);

// Get all documents for the current user
export const listDocuments = query({
  args: {
    category: v.optional(documentCategory),
  },
  handler: async (ctx, { category }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    if (category) {
      return await ctx.db
        .query("userDocuments")
        .withIndex("by_user_category", (q) =>
          q.eq("userId", user._id).eq("category", category)
        )
        .collect();
    }

    return await ctx.db
      .query("userDocuments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get a single document
export const getDocument = query({
  args: {
    documentId: v.id("userDocuments"),
  },
  handler: async (ctx, { documentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const doc = await ctx.db.get(documentId);
    if (!doc) return null;

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) return null;

    return doc;
  },
});

// Get download URL for a document
export const getDocumentUrl = query({
  args: {
    documentId: v.id("userDocuments"),
  },
  handler: async (ctx, { documentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const doc = await ctx.db.get(documentId);
    if (!doc) return null;

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) return null;

    return await ctx.storage.getUrl(doc.storageId);
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Save document after upload
export const saveDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    category: documentCategory,
    displayName: v.string(),
    description: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    issuedDate: v.optional(v.number()),
    issuingCountry: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    return await ctx.db.insert("userDocuments", {
      userId: user._id,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      category: args.category,
      displayName: args.displayName,
      description: args.description,
      expiryDate: args.expiryDate,
      issuedDate: args.issuedDate,
      issuingCountry: args.issuingCountry,
      tags: args.tags,
      uploadedAt: now,
      updatedAt: now,
    });
  },
});

// Update document metadata
export const updateDocument = mutation({
  args: {
    documentId: v.id("userDocuments"),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(documentCategory),
    expiryDate: v.optional(v.number()),
    issuedDate: v.optional(v.number()),
    issuingCountry: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { documentId, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.expiryDate !== undefined) updateData.expiryDate = updates.expiryDate;
    if (updates.issuedDate !== undefined) updateData.issuedDate = updates.issuedDate;
    if (updates.issuingCountry !== undefined) updateData.issuingCountry = updates.issuingCountry;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    await ctx.db.patch(documentId, updateData);
    return documentId;
  },
});

// Delete document
export const deleteDocument = mutation({
  args: {
    documentId: v.id("userDocuments"),
  },
  handler: async (ctx, { documentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Delete from storage
    await ctx.storage.delete(doc.storageId);

    // Delete record
    await ctx.db.delete(documentId);
  },
});

// Get expiring documents (within 90 days)
export const getExpiringDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const ninetyDaysFromNow = Date.now() + 90 * 24 * 60 * 60 * 1000;

    const allDocs = await ctx.db
      .query("userDocuments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return allDocs.filter(
      (doc) => doc.expiryDate && doc.expiryDate <= ninetyDaysFromNow
    );
  },
});

// Get document stats
export const getDocumentStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const allDocs = await ctx.db
      .query("userDocuments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const byCategory: Record<string, number> = {};
    let totalSize = 0;
    const expiringCount = allDocs.filter((doc) => {
      if (doc.expiryDate) {
        const ninetyDaysFromNow = Date.now() + 90 * 24 * 60 * 60 * 1000;
        return doc.expiryDate <= ninetyDaysFromNow;
      }
      return false;
    }).length;

    for (const doc of allDocs) {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      totalSize += doc.fileSize;
    }

    return {
      totalCount: allDocs.length,
      byCategory,
      totalSize,
      expiringCount,
    };
  },
});
