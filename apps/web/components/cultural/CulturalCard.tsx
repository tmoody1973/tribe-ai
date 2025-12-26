"use client";

import { useState, useRef } from "react";
import { X, Download, Share2, Copy, Check, Printer } from "lucide-react";
import html2canvas from "html2canvas";

interface CulturalCardData {
  originCulture: string;
  greetingCustoms: string;
  communicationTips: string[];
  foodTraditions: string;
  importantHolidays: string[];
  whatToKnow: string;
}

interface CulturalCardProps {
  data: CulturalCardData;
  onClose: () => void;
}

export function CulturalCard({ data, onClose }: CulturalCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#fff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `cultural-card-${data.originCulture.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to download card:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyText = async () => {
    const text = `
${data.originCulture} Cultural Card

GREETING CUSTOMS
${data.greetingCustoms}

COMMUNICATION TIPS
${data.communicationTips.map(tip => `• ${tip}`).join("\n")}

FOOD TRADITIONS
${data.foodTraditions}

IMPORTANT HOLIDAYS
${data.importantHolidays.map(h => `• ${h}`).join("\n")}

WHAT TO KNOW
${data.whatToKnow}

Generated with TRIBE - The Diaspora Intelligence Network
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.originCulture} Cultural Card`,
          text: `Learn about ${data.originCulture} culture - greeting customs, communication tips, and more!`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-amber-100">
          <h2 className="font-head text-xl">Cultural Card</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
              title="Copy as text"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
              title="Print"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
              title="Share"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Download as image"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 border-2 border-black bg-white hover:bg-red-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Card Content - Printable Area */}
        <div ref={cardRef} className="p-6 print:p-8">
          {/* Card Header */}
          <div className="text-center mb-6 pb-4 border-b-4 border-black">
            <div className="text-5xl mb-2">🌍</div>
            <h1 className="font-head text-2xl mb-1">{data.originCulture}</h1>
            <p className="text-sm text-gray-600">Cultural Guide</p>
          </div>

          {/* Greeting Customs */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👋</span>
              <h3 className="font-bold text-lg">Greeting Customs</h3>
            </div>
            <div className="bg-blue-50 border-2 border-black p-3">
              <p className="text-sm">{data.greetingCustoms}</p>
            </div>
          </div>

          {/* Communication Tips */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💬</span>
              <h3 className="font-bold text-lg">Communication Tips</h3>
            </div>
            <ul className="space-y-2">
              {data.communicationTips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 bg-green-50 border-2 border-black p-2"
                >
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Food Traditions */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🍽️</span>
              <h3 className="font-bold text-lg">Food Traditions</h3>
            </div>
            <div className="bg-orange-50 border-2 border-black p-3">
              <p className="text-sm">{data.foodTraditions}</p>
            </div>
          </div>

          {/* Important Holidays */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <h3 className="font-bold text-lg">Important Holidays</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.importantHolidays.map((holiday, i) => (
                <span
                  key={i}
                  className="bg-purple-100 border-2 border-black px-3 py-1 text-sm font-medium"
                >
                  {holiday}
                </span>
              ))}
            </div>
          </div>

          {/* What to Know */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <h3 className="font-bold text-lg">What to Know</h3>
            </div>
            <div className="bg-yellow-50 border-2 border-black p-3">
              <p className="text-sm">{data.whatToKnow}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t-2 border-gray-300">
            <p className="text-xs text-gray-500">
              Generated with TRIBE • The Diaspora Intelligence Network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
