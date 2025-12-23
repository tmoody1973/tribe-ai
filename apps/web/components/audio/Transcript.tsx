"use client";

interface TranscriptProps {
  text: string;
  className?: string;
}

export function Transcript({ text, className = "" }: TranscriptProps) {
  // Split into paragraphs for readability
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());

  return (
    <div
      className={`prose prose-sm max-w-none bg-gray-50 border-2 border-gray-200 p-4 max-h-96 overflow-y-auto ${className}`}
    >
      {paragraphs.map((para, i) => (
        <p key={i} className="mb-4 text-gray-700 leading-relaxed last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
}
