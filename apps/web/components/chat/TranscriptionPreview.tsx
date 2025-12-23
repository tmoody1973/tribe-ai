"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, X, RotateCcw } from "lucide-react";

interface TranscriptionPreviewProps {
  text: string;
  onSend: (text: string) => void;
  onCancel: () => void;
  onReRecord: () => void;
}

export function TranscriptionPreview({
  text,
  onSend,
  onCancel,
  onReRecord,
}: TranscriptionPreviewProps) {
  const t = useTranslations("chat.voice");
  const [editedText, setEditedText] = useState(text);

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  const handleSend = () => {
    if (editedText.trim()) {
      onSend(editedText.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="border-4 border-black bg-yellow-50 p-4 shadow-[4px_4px_0_0_#000]">
      <div className="text-xs font-bold text-gray-500 mb-2">
        {t("transcription")}
      </div>

      {/* Editable Transcription */}
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full p-3 border-2 border-black resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
        rows={3}
        autoFocus
        placeholder={t("editPlaceholder")}
      />

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSend}
          disabled={!editedText.trim()}
          className={`
            flex-1 py-2 font-bold flex items-center justify-center gap-2 border-4 border-black transition-colors
            ${editedText.trim() ? "bg-black text-white hover:bg-gray-800" : "bg-gray-200 text-gray-500 cursor-not-allowed"}
          `}
        >
          <Send size={16} />
          {t("send")}
        </button>
        <button
          onClick={onReRecord}
          className="p-2 border-4 border-black hover:bg-gray-100 transition-colors"
          title={t("reRecord")}
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={onCancel}
          className="p-2 border-4 border-black hover:bg-red-100 transition-colors"
          title={t("cancel")}
        >
          <X size={20} />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        {t("keyboardHint")}
      </div>
    </div>
  );
}
