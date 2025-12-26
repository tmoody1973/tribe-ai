"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { X, Loader2 } from "lucide-react";

type Priority = "critical" | "high" | "medium" | "low";
type Category = "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";

interface TaskFormProps {
  corridorId: Id<"corridors">;
  task?: Doc<"tasks">; // If provided, we're editing
  onClose: () => void;
  onSuccess?: () => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "bg-red-100 border-red-500" },
  { value: "high", label: "High", color: "bg-orange-100 border-orange-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 border-yellow-500" },
  { value: "low", label: "Low", color: "bg-green-100 border-green-500" },
];

const categoryOptions: { value: Category; label: string; icon: string }[] = [
  { value: "visa", label: "Visa", icon: "🛂" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "housing", label: "Housing", icon: "🏠" },
  { value: "employment", label: "Employment", icon: "💼" },
  { value: "legal", label: "Legal", icon: "⚖️" },
  { value: "health", label: "Health", icon: "🏥" },
  { value: "social", label: "Social", icon: "👥" },
];

export function TaskForm({ corridorId, task, onClose, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [category, setCategory] = useState<Category | "">(task?.category ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const isEditing = !!task;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateTask({
          taskId: task._id,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category: category || undefined,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createTask({
          corridorId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category: category || undefined,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm("Are you sure you want to delete this task?")) return;

    setIsSubmitting(true);
    try {
      await deleteTask({ taskId: task._id });
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black bg-amber-100">
          <h2 className="font-bold text-lg">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-200 border border-transparent hover:border-black transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border-2 border-black p-2 focus:ring-0 focus:border-black focus:shadow-[2px_2px_0_0_#000]"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full border-2 border-black p-2 resize-none focus:ring-0 focus:border-black focus:shadow-[2px_2px_0_0_#000]"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-bold mb-1">Priority</label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-3 py-1 text-sm border-2 border-black transition-all ${
                    priority === opt.value
                      ? `${opt.color} shadow-[2px_2px_0_0_#000]`
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(category === opt.value ? "" : opt.value)}
                  className={`px-2 py-1 text-sm border-2 border-black transition-all ${
                    category === opt.value
                      ? "bg-cyan-100 shadow-[2px_2px_0_0_#000]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-bold mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-2 border-black p-2 focus:ring-0 focus:border-black focus:shadow-[2px_2px_0_0_#000]"
            />
          </div>

          {/* Notes (only when editing) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-bold mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add personal notes..."
                rows={2}
                className="w-full border-2 border-black p-2 resize-none focus:ring-0 focus:border-black focus:shadow-[2px_2px_0_0_#000]"
              />
            </div>
          )}

          {/* Protocol Link Indicator */}
          {task?.protocolStepId && (
            <div className="bg-blue-50 border-2 border-blue-200 p-3 text-sm">
              <span className="font-medium">📋 Linked to Protocol Step</span>
              <p className="text-gray-600 text-xs mt-1">
                Completing this task will mark the protocol step as done.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-red-600 border-2 border-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-4 py-2 border-2 border-black bg-black text-white font-bold shadow-[2px_2px_0_0_#666] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isEditing ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
