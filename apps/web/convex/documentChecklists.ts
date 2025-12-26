import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get document checklist for a protocol
export const getChecklist = query({
  args: {
    protocolId: v.id("protocols"),
  },
  handler: async (ctx, { protocolId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    return await ctx.db
      .query("documentChecklists")
      .withIndex("by_protocol", (q) => q.eq("protocolId", protocolId))
      .first();
  },
});

// Save or update document checklist
export const saveChecklist = mutation({
  args: {
    protocolId: v.id("protocols"),
    corridorId: v.id("corridors"),
    documents: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        required: v.boolean(),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { protocolId, corridorId, documents }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if checklist already exists
    const existing = await ctx.db
      .query("documentChecklists")
      .withIndex("by_protocol", (q) => q.eq("protocolId", protocolId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        documents,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("documentChecklists", {
      protocolId,
      corridorId,
      userId: user._id,
      documents,
      generatedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Toggle document completion status
export const toggleDocument = mutation({
  args: {
    protocolId: v.id("protocols"),
    documentId: v.string(),
  },
  handler: async (ctx, { protocolId, documentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const checklist = await ctx.db
      .query("documentChecklists")
      .withIndex("by_protocol", (q) => q.eq("protocolId", protocolId))
      .first();

    if (!checklist) throw new Error("Checklist not found");

    const updatedDocuments = checklist.documents.map((doc) => {
      if (doc.id === documentId) {
        return {
          ...doc,
          completed: !doc.completed,
          completedAt: !doc.completed ? Date.now() : undefined,
        };
      }
      return doc;
    });

    await ctx.db.patch(checklist._id, {
      documents: updatedDocuments,
      updatedAt: Date.now(),
    });
  },
});
