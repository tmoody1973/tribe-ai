import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Column type for validation
const columnValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("blocked"),
  v.literal("done")
);

const priorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

const categoryValidator = v.union(
  v.literal("visa"),
  v.literal("finance"),
  v.literal("housing"),
  v.literal("employment"),
  v.literal("legal"),
  v.literal("health"),
  v.literal("social")
);

// ============ QUERIES ============

/**
 * Get all tasks for a corridor (journey)
 */
export const getTasks = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    // Sort by column order
    return tasks.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get tasks grouped by column for the Kanban board
 */
export const getTasksByColumns = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    // Group by column
    const columns = {
      todo: tasks.filter((t) => t.column === "todo").sort((a, b) => a.order - b.order),
      in_progress: tasks.filter((t) => t.column === "in_progress").sort((a, b) => a.order - b.order),
      blocked: tasks.filter((t) => t.column === "blocked").sort((a, b) => a.order - b.order),
      done: tasks.filter((t) => t.column === "done").sort((a, b) => a.order - b.order),
    };

    return columns;
  },
});

/**
 * Get a single task by ID
 */
export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.get(taskId);
  },
});

/**
 * Check if a protocol step already has an associated task
 */
export const getTaskForProtocolStep = query({
  args: { protocolStepId: v.id("protocols") },
  handler: async (ctx, { protocolStepId }) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_protocol_step", (q) => q.eq("protocolStepId", protocolStepId))
      .first();

    return task;
  },
});

/**
 * Get task count per column for a corridor
 */
export const getTaskCounts = query({
  args: { corridorId: v.id("corridors") },
  handler: async (ctx, { corridorId }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_corridor", (q) => q.eq("corridorId", corridorId))
      .collect();

    return {
      todo: tasks.filter((t) => t.column === "todo").length,
      in_progress: tasks.filter((t) => t.column === "in_progress").length,
      blocked: tasks.filter((t) => t.column === "blocked").length,
      done: tasks.filter((t) => t.column === "done").length,
      total: tasks.length,
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new custom task
 */
export const createTask = mutation({
  args: {
    corridorId: v.id("corridors"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityValidator,
    category: v.optional(categoryValidator),
    dueDate: v.optional(v.number()),
    column: v.optional(columnValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify corridor exists and belongs to user
    const corridor = await ctx.db.get(args.corridorId);
    if (!corridor) throw new Error("Corridor not found");

    // Get the max order for the target column
    const column = args.column || "todo";
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_corridor_column", (q) =>
        q.eq("corridorId", args.corridorId).eq("column", column)
      )
      .collect();

    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), -1);

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      corridorId: args.corridorId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      category: args.category,
      dueDate: args.dueDate,
      column: column,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return taskId;
  },
});

/**
 * Create a task from a protocol step
 */
export const createTaskFromProtocol = mutation({
  args: { protocolStepId: v.id("protocols") },
  handler: async (ctx, { protocolStepId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get the protocol step
    const protocol = await ctx.db.get(protocolStepId);
    if (!protocol) throw new Error("Protocol step not found");

    // Check if task already exists for this protocol
    const existingTask = await ctx.db
      .query("tasks")
      .withIndex("by_protocol_step", (q) => q.eq("protocolStepId", protocolStepId))
      .first();

    if (existingTask) {
      throw new Error("Task already exists for this protocol step");
    }

    // Get max order for todo column
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_corridor_column", (q) =>
        q.eq("corridorId", protocol.corridorId).eq("column", "todo")
      )
      .collect();

    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), -1);

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      corridorId: protocol.corridorId,
      protocolStepId: protocolStepId,
      title: protocol.title,
      description: protocol.description,
      priority: protocol.priority,
      category: protocol.category,
      dueDate: protocol.dueDate,
      column: "todo",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return taskId;
  },
});

/**
 * Update task column (for drag-and-drop)
 * Also syncs with protocol step if linked
 */
export const updateTaskColumn = mutation({
  args: {
    taskId: v.id("tasks"),
    column: columnValidator,
    order: v.number(),
  },
  handler: async (ctx, { taskId, column, order }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    const now = Date.now();
    const updates: {
      column: typeof column;
      order: number;
      updatedAt: number;
      completedAt?: number;
    } = {
      column,
      order,
      updatedAt: now,
    };

    // If moving to done, set completedAt
    if (column === "done" && task.column !== "done") {
      updates.completedAt = now;

      // If task is linked to a protocol, mark protocol as completed
      if (task.protocolStepId) {
        await ctx.db.patch(task.protocolStepId, {
          status: "completed",
          completedAt: now,
        });
      }
    }

    // If moving out of done, clear completedAt
    if (column !== "done" && task.column === "done") {
      updates.completedAt = undefined;

      // If task is linked to a protocol, un-complete it
      if (task.protocolStepId) {
        await ctx.db.patch(task.protocolStepId, {
          status: "in_progress",
          completedAt: undefined,
        });
      }
    }

    await ctx.db.patch(taskId, updates);
  },
});

/**
 * Reorder tasks within a column after drag-drop
 */
export const reorderTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    orders: v.array(v.number()),
  },
  handler: async (ctx, { taskIds, orders }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (taskIds.length !== orders.length) {
      throw new Error("taskIds and orders must have same length");
    }

    const now = Date.now();
    for (let i = 0; i < taskIds.length; i++) {
      await ctx.db.patch(taskIds[i], {
        order: orders[i],
        updatedAt: now,
      });
    }
  },
});

/**
 * Update task details
 */
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    category: v.optional(categoryValidator),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { taskId, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(taskId, filteredUpdates);
  },
});

/**
 * Delete a task
 */
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.delete(taskId);
  },
});

/**
 * Sync protocol completion to task
 * Called when a protocol step is marked complete from the protocol UI
 */
export const syncProtocolToTask = mutation({
  args: {
    protocolStepId: v.id("protocols"),
    completed: v.boolean(),
  },
  handler: async (ctx, { protocolStepId, completed }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Find task linked to this protocol
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_protocol_step", (q) => q.eq("protocolStepId", protocolStepId))
      .first();

    if (!task) return; // No linked task, nothing to sync

    const now = Date.now();
    if (completed && task.column !== "done") {
      await ctx.db.patch(task._id, {
        column: "done",
        completedAt: now,
        updatedAt: now,
      });
    } else if (!completed && task.column === "done") {
      await ctx.db.patch(task._id, {
        column: "in_progress",
        completedAt: undefined,
        updatedAt: now,
      });
    }
  },
});
