"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Plus, Circle, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ColumnId = "todo" | "in_progress" | "blocked" | "done";

interface TaskColumnProps {
  id: ColumnId;
  title: string;
  tasks: Doc<"tasks">[];
  onAddTask?: () => void;
  onTaskClick?: (task: Doc<"tasks">) => void;
}

const columnConfig: Record<ColumnId, { icon: React.ReactNode; color: string; bgColor: string }> = {
  todo: {
    icon: <Circle size={16} />,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
  },
  in_progress: {
    icon: <Clock size={16} />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  blocked: {
    icon: <AlertTriangle size={16} />,
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
  done: {
    icon: <CheckCircle size={16} />,
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
};

export function TaskColumn({
  id,
  title,
  tasks,
  onAddTask,
  onTaskClick,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfig[id];

  return (
    <div
      className={cn(
        "flex flex-col min-h-[400px] border-2 border-black",
        config.bgColor
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between p-3 border-b-2 border-black",
        config.bgColor
      )}>
        <div className={cn("flex items-center gap-2", config.color)}>
          {config.icon}
          <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
          <span className="bg-white border border-black text-xs font-bold px-1.5 py-0.5 min-w-[24px] text-center">
            {tasks.length}
          </span>
        </div>
        {onAddTask && id === "todo" && (
          <button
            onClick={onAddTask}
            className="p-1 hover:bg-white/50 border border-transparent hover:border-black transition-all"
            title="Add task"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 overflow-y-auto transition-colors",
          isOver && "bg-yellow-100/50 ring-2 ring-inset ring-yellow-400"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <div className="text-2xl mb-2">
              {id === "todo" && "📋"}
              {id === "in_progress" && "⏳"}
              {id === "blocked" && "🚧"}
              {id === "done" && "✅"}
            </div>
            <p className="text-sm text-center">
              {id === "todo" && "Add tasks to get started"}
              {id === "in_progress" && "Drag tasks here when working"}
              {id === "blocked" && "Tasks that need attention"}
              {id === "done" && "Completed tasks appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
