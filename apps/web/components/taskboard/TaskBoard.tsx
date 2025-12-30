"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { Plus, LayoutGrid, Loader2 } from "lucide-react";

type ColumnId = "todo" | "in_progress" | "blocked" | "done";

interface TaskBoardProps {
  corridorId: Id<"corridors">;
}

const columnTitles: Record<ColumnId, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export function TaskBoard({ corridorId }: TaskBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Doc<"tasks"> | null>(null);
  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);

  // Fetch tasks grouped by column
  const tasksByColumn = useQuery(api.tasks.getTasksByColumns, { corridorId });
  const updateTaskColumn = useMutation(api.tasks.updateTaskColumn);
  const reorderTasks = useMutation(api.tasks.reorderTasks);

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms hold before drag starts on touch
        tolerance: 5,
      },
    })
  );

  // Find which column a task is in
  const findColumn = (taskId: string): ColumnId | null => {
    if (!tasksByColumn) return null;

    for (const [column, tasks] of Object.entries(tasksByColumn)) {
      if ((tasks as any[]).some((t: any) => t._id === taskId)) {
        return column as ColumnId;
      }
    }
    return null;
  };

  // Get task by ID from any column
  const getTask = (taskId: string): Doc<"tasks"> | null => {
    if (!tasksByColumn) return null;

    for (const tasks of Object.values(tasksByColumn)) {
      const task = (tasks as any[]).find((t: any) => t._id === taskId);
      if (task) return task;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = getTask(event.active.id as string);
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Get the current and target columns
    const activeColumn = findColumn(activeId);
    let overColumn: ColumnId | null = null;

    // Check if dropping on a column directly
    if (["todo", "in_progress", "blocked", "done"].includes(overId)) {
      overColumn = overId as ColumnId;
    } else {
      // Dropping on another task
      overColumn = findColumn(overId);
    }

    if (!activeColumn || !overColumn) return;

    const task = getTask(activeId);
    if (!task) return;

    // Calculate new order
    const targetTasks = tasksByColumn?.[overColumn] ?? [];
    let newOrder: number;

    if (activeColumn === overColumn) {
      // Reordering within same column
      const oldIndex = (targetTasks as any[]).findIndex((t: any) => t._id === activeId);
      const newIndex = (targetTasks as any[]).findIndex((t: any) => t._id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        const reorderedTasks = arrayMove(targetTasks as any[], oldIndex, newIndex);
        const taskIds = reorderedTasks.map((t: any) => t._id);
        const orders = reorderedTasks.map((_: any, i: number) => i);
        await reorderTasks({ taskIds, orders });
      }
      return;
    }

    // Moving to different column
    if (overId === overColumn) {
      // Dropped on empty column or column header
      newOrder = targetTasks.length;
    } else {
      // Dropped on a task - insert at that position
      const overIndex = (targetTasks as any[]).findIndex((t: any) => t._id === overId);
      newOrder = overIndex >= 0 ? overIndex : targetTasks.length;
    }

    await updateTaskColumn({
      taskId: task._id,
      column: overColumn,
      order: newOrder,
    });
  };

  const handleTaskClick = (task: Doc<"tasks">) => {
    setEditingTask(task);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // Loading state
  if (tasksByColumn === undefined) {
    return (
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  const totalTasks = Object.values(tasksByColumn).reduce(
    (sum: number, tasks) => sum + (tasks as any[]).length,
    0
  );

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-4 border-black bg-gradient-to-r from-amber-100 to-cyan-100">
        <div className="flex items-center gap-3">
          <LayoutGrid size={24} className="text-gray-700" />
          <div>
            <h2 className="font-bold text-lg">Task Board</h2>
            <p className="text-sm text-gray-600">
              {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0_0_#666] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(columnTitles) as ColumnId[]).map((columnId) => (
              <TaskColumn
                key={columnId}
                id={columnId}
                title={columnTitles[columnId]}
                tasks={tasksByColumn[columnId] ?? []}
                onAddTask={columnId === "todo" ? () => setShowForm(true) : undefined}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask && (
              <div className="opacity-90 rotate-3">
                <TaskCard task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Empty State */}
      {totalTasks === 0 && (
        <div className="px-4 pb-6 text-center">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 py-8 px-4">
            <p className="text-gray-500 mb-4">
              No tasks yet. Add tasks to track your migration progress!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 font-bold border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Plus size={18} />
              Create Your First Task
            </button>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {(showForm || editingTask) && (
        <TaskForm
          corridorId={corridorId}
          task={editingTask ?? undefined}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
