"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Doc<"tasks">;
  onClick?: () => void;
}

const priorityColors = {
  critical: "bg-red-100 border-red-500 text-red-700",
  high: "bg-orange-100 border-orange-500 text-orange-700",
  medium: "bg-yellow-100 border-yellow-500 text-yellow-700",
  low: "bg-green-100 border-green-500 text-green-700",
};

const categoryIcons: Record<string, string> = {
  visa: "🛂",
  finance: "💰",
  housing: "🏠",
  employment: "💼",
  legal: "⚖️",
  health: "🏥",
  social: "👥",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.column !== "done";
  const isDueToday = task.dueDate &&
    new Date(task.dueDate).toDateString() === new Date().toDateString() &&
    task.column !== "done";

  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border-2 border-black p-3 cursor-pointer transition-all",
        "hover:shadow-[2px_2px_0_0_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]",
        isDragging && "opacity-50 shadow-[4px_4px_0_0_#000] rotate-2",
        task.column === "done" && "opacity-70"
      )}
      onClick={onClick}
    >
      {/* Drag Handle + Category */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -m-1 text-gray-400 hover:text-gray-600"
          >
            <GripVertical size={14} />
          </button>
          {task.category && (
            <span className="text-sm" title={task.category}>
              {categoryIcons[task.category]}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-xs px-2 py-0.5 border font-medium",
            priorityColors[task.priority]
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className={cn(
        "font-bold text-sm mb-1 line-clamp-2",
        task.column === "done" && "line-through text-gray-500"
      )}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Due date + Protocol indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        {task.dueDate ? (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue && "text-red-600 font-medium",
              isDueToday && !isOverdue && "text-orange-600 font-medium",
              !isOverdue && !isDueToday && "text-gray-500"
            )}
          >
            {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
            <span>{formatDueDate(task.dueDate)}</span>
          </div>
        ) : (
          <span />
        )}

        {task.protocolStepId && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 border border-blue-300">
            Protocol
          </span>
        )}
      </div>
    </div>
  );
}
