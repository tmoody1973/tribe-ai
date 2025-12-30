"use client";

import { Save, Share2, ExternalLink, Check } from "lucide-react";
import { useState } from "react";

interface CardActionsProps {
  /** Data to save to vault (not implemented - placeholder for future) */
  saveData?: {
    title: string;
    url?: string;
    content?: string;
    type: "housing" | "visa" | "resource";
  };
  /** URL to copy when sharing */
  shareUrl?: string;
  /** URL to open for more info */
  learnMoreUrl?: string;
  /** Custom share text */
  shareText?: string;
}

export function CardActions({
  saveData,
  shareUrl,
  learnMoreUrl,
  shareText,
}: CardActionsProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!saveData) return;

    // TODO: Implement save to vault functionality
    // This would require a Convex mutation for saving resources/bookmarks
    // For now, just show visual feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Log for development
    console.log("Save to vault:", saveData);
  };

  const handleShare = async () => {
    const textToShare = shareText || shareUrl || "";

    if (navigator.share && shareUrl) {
      // Use native share on mobile
      try {
        await navigator.share({
          title: saveData?.title || "TRIBE Resource",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    // Copy to clipboard
    if (textToShare) {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Don't render if no actions available
  if (!saveData && !shareUrl && !learnMoreUrl) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t-2 border-black">
      {saveData && (
        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex items-center gap-1 px-2 py-1 border-2 border-black text-xs font-bold transition-colors ${
            saved
              ? "bg-green-200 text-green-800"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {saved ? (
            <>
              <Check className="w-3 h-3" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-3 h-3" />
              Save
            </>
          )}
        </button>
      )}
      {shareUrl && (
        <button
          onClick={handleShare}
          disabled={copied}
          className={`flex items-center gap-1 px-2 py-1 border-2 border-black text-xs font-bold transition-colors ${
            copied
              ? "bg-blue-200 text-blue-800"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Share2 className="w-3 h-3" />
              Share
            </>
          )}
        </button>
      )}
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 border-2 border-black bg-white hover:bg-gray-100 text-xs font-bold transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Learn More
        </a>
      )}
    </div>
  );
}
