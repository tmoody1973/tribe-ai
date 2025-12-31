"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Hook to register frontend tools that allow the AI agent to control the UI.
 *
 * Available tools:
 * - navigateToCorridor: Navigate to a specific corridor dashboard
 * - openExpenseModal: Navigate to finances page to add expense
 * - saveToVault: Save a resource to the user's saved items
 * - addToTodos: Add a task to the user's task board
 *
 * Usage: Call this hook once in your chat component.
 */
export function useFrontendTools() {
  const router = useRouter();
  const corridor = useQuery(api.corridors.getActiveCorridor);
  const createTask = useMutation(api.tasks.createTask);
  const saveFeedItem = useMutation(api.corridorFeed.saveFeedItem);

  // Tool: Navigate to a corridor dashboard
  useCopilotAction({
    name: "navigate_to_corridor",
    description: "Navigate the user to a specific corridor's dashboard. Use when the user wants to view or work on a particular migration corridor.",
    parameters: [
      {
        name: "corridorId",
        type: "string",
        description: "The ID of the corridor to navigate to",
        required: true,
      },
    ],
    handler: async ({ corridorId }) => {
      try {
        router.push(`/dashboard`);
        return {
          success: true,
          message: `Navigating to corridor dashboard`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to navigate: ${error}`,
        };
      }
    },
  });

  // Tool: Navigate to finances page (for adding expense)
  useCopilotAction({
    name: "open_expense_form",
    description: "Navigate to the finances page where the user can add a new expense. Use after discussing finances or when user wants to track spending.",
    parameters: [
      {
        name: "suggested_category",
        type: "string",
        description: "Suggested expense category: visaImmigration, tests, travel, settlement, financial, miscellaneous",
        required: false,
      },
      {
        name: "suggested_amount",
        type: "number",
        description: "Suggested expense amount if known",
        required: false,
      },
    ],
    handler: async ({ suggested_category, suggested_amount }) => {
      try {
        // Navigate to finances page - the modal will need to be opened manually
        // In a future iteration, we could use URL params or global state
        router.push(`/finances`);

        const hints: string[] = [];
        if (suggested_category) hints.push(`category: ${suggested_category}`);
        if (suggested_amount) hints.push(`amount: $${suggested_amount}`);

        return {
          success: true,
          message: `Navigating to finances page to add expense${hints.length > 0 ? ` (suggested: ${hints.join(", ")})` : ""}`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to open finances: ${error}`,
        };
      }
    },
  });

  // Tool: Save resource to vault
  useCopilotAction({
    name: "save_to_vault",
    description: "Save a helpful resource or link to the user's saved items. Use when you've found useful resources the user might want to keep for reference.",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title of the resource to save",
        required: true,
      },
      {
        name: "url",
        type: "string",
        description: "URL of the resource",
        required: false,
      },
      {
        name: "summary",
        type: "string",
        description: "Brief summary or notes about the resource",
        required: false,
      },
      {
        name: "source",
        type: "string",
        description: "Source type: reddit, youtube, forum, news, official",
        required: false,
      },
    ],
    handler: async ({ title, url, summary, source }) => {
      try {
        if (!corridor) {
          return {
            success: false,
            error: "No active corridor found. Please select a corridor first.",
          };
        }

        await saveFeedItem({
          origin: corridor.origin,
          destination: corridor.destination,
          source: (source as "reddit" | "youtube" | "forum" | "news" | "official") || "official",
          title,
          snippet: summary || "",
          url: url || "",
        });

        return {
          success: true,
          message: `Saved "${title}" to your corridor feed`,
          savedItem: { title, url, summary },
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to save: ${error}`,
        };
      }
    },
  });

  // Tool: Add task to todo list
  useCopilotAction({
    name: "add_to_todos",
    description: "Add a task to the user's task board. Use when suggesting actionable next steps for their migration journey.",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title/description of the task",
        required: true,
      },
      {
        name: "priority",
        type: "string",
        description: "Priority: critical, high, medium, low",
        required: false,
      },
      {
        name: "category",
        type: "string",
        description: "Category: visa, finance, housing, employment, legal, health, social",
        required: false,
      },
      {
        name: "dueDate",
        type: "string",
        description: "Due date in ISO format (e.g., 2024-03-15)",
        required: false,
      },
    ],
    handler: async ({ title, priority, category, dueDate }) => {
      try {
        if (!corridor) {
          return {
            success: false,
            error: "No active corridor found. Please select a corridor first.",
          };
        }

        const taskPriority = (priority as "critical" | "high" | "medium" | "low") || "medium";
        const taskCategory = category as "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social" | undefined;

        const taskId = await createTask({
          corridorId: corridor._id,
          title,
          priority: taskPriority,
          category: taskCategory,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });

        return {
          success: true,
          message: `Added "${title}" to your task board`,
          taskId: taskId,
          viewUrl: "/dashboard/tasks",
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to add task: ${error}`,
        };
      }
    },
  });

  // Tool: Navigate to documents page
  useCopilotAction({
    name: "view_documents",
    description: "Navigate to the documents page. Use when the user wants to view or manage their saved documents.",
    parameters: [],
    handler: async () => {
      try {
        router.push(`/dashboard/documents`);
        return {
          success: true,
          message: "Navigating to your documents",
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to navigate: ${error}`,
        };
      }
    },
  });

  // Tool: Navigate to task board
  useCopilotAction({
    name: "view_task_board",
    description: "Navigate to the task board. Use when the user wants to see their tasks or manage their todo list.",
    parameters: [],
    handler: async () => {
      try {
        router.push(`/dashboard/tasks`);
        return {
          success: true,
          message: "Navigating to your task board",
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to navigate: ${error}`,
        };
      }
    },
  });
}
