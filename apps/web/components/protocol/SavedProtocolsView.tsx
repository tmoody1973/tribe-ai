"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Bookmark, Trash2, Edit2, Check, X, Clock, Tag } from "lucide-react";

interface SavedProtocol {
  _id: Id<"savedProtocols">;
  userId: Id<"users">;
  corridorId: Id<"corridors">;
  originalProtocolId?: Id<"protocols">;
  snapshot: {
    category: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    warnings?: string[];
    hacks?: string[];
    generatedForStage?: string;
  };
  notes?: string;
  tags?: string[];
  savedAt: number;
  updatedAt?: number;
}

interface SavedProtocolsViewProps {
  savedProtocols: SavedProtocol[];
  corridorId: Id<"corridors">;
  userId: Id<"users">;
}

const categoryColors: Record<string, string> = {
  visa: "border-l-purple-500 bg-purple-50",
  finance: "border-l-green-500 bg-green-50",
  housing: "border-l-blue-500 bg-blue-50",
  employment: "border-l-orange-500 bg-orange-50",
  legal: "border-l-red-500 bg-red-50",
  health: "border-l-pink-500 bg-pink-50",
  social: "border-l-cyan-500 bg-cyan-50",
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

export function SavedProtocolsView({
  savedProtocols,
  corridorId: _corridorId,
  userId: _userId,
}: SavedProtocolsViewProps) {
  // These props are kept for future features (filtering, user-specific actions)
  void _corridorId;
  void _userId;
  const t = useTranslations("protocols");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const updateNotes = useMutation(api.protocolArchive.updateSavedProtocolNotes);
  const deleteSaved = useMutation(api.protocolArchive.deleteSavedProtocol);

  // Empty state
  if (savedProtocols.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 border-4 border-black flex items-center justify-center">
          <Bookmark size={32} className="text-yellow-600" />
        </div>
        <h3 className="font-bold text-lg mb-2">{t("saved.empty")}</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {t("saved.emptyDescription")}
        </p>
      </div>
    );
  }

  const handleEditNotes = (savedId: string, currentNotes: string) => {
    setEditingNotes(savedId);
    setNotesText(currentNotes || "");
  };

  const handleSaveNotes = async (savedId: Id<"savedProtocols">) => {
    await updateNotes({ savedProtocolId: savedId, notes: notesText });
    setEditingNotes(null);
    setNotesText("");
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotesText("");
  };

  const handleDelete = async (savedId: Id<"savedProtocols">) => {
    if (window.confirm("Remove this from your saved protocols?")) {
      await deleteSaved({ savedProtocolId: savedId });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Saved Header */}
      <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
        <Bookmark size={20} className="text-yellow-600" />
        <h3 className="font-bold">{t("saved.title")}</h3>
        <span className="text-sm text-gray-500">
          ({savedProtocols.length} saved)
        </span>
      </div>

      {/* Saved Protocol Cards */}
      <div className="space-y-4">
        {savedProtocols.map((saved) => (
          <div
            key={saved._id}
            className={`
              border-4 border-black border-l-8 shadow-[4px_4px_0_0_#000]
              ${categoryColors[saved.snapshot.category] || "bg-white"}
            `}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span>{categoryIcons[saved.snapshot.category] || "📋"}</span>
                    <span className="text-xs font-bold uppercase text-gray-500">
                      {saved.snapshot.category}
                    </span>
                    {saved.snapshot.generatedForStage && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        From: {saved.snapshot.generatedForStage}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg">{saved.snapshot.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {saved.snapshot.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditNotes(saved._id, saved.notes || "")}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                    title={t("saved.addNotes")}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(saved._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              {editingNotes === saved._id ? (
                <div className="mt-4 border-t-2 border-gray-300 pt-4">
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    {t("saved.notes")}
                  </label>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Add your personal notes..."
                    className="w-full p-3 border-2 border-black resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveNotes(saved._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white font-bold border-2 border-black hover:bg-green-600"
                    >
                      <Check size={16} /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 font-bold border-2 border-black hover:bg-gray-200"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : saved.notes ? (
                <div className="mt-4 p-3 bg-white border-2 border-gray-300">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-1">
                    <Edit2 size={14} />
                    {t("saved.notes")}
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {saved.notes}
                  </p>
                </div>
              ) : null}

              {/* Tags */}
              {saved.tags && saved.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Tag size={14} className="text-gray-400" />
                  {saved.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-200 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <Clock size={12} />
                <span>
                  {t("saved.savedOn")} {formatDate(saved.savedAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
