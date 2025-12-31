"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Search, Sparkles, AlertCircle } from "lucide-react";

interface LiveSearchResultProps {
  answer: string;
  sources: string[];
  quotaRemaining?: number;
  quotaLimit?: number;
  error?: boolean;
  message?: string;
}

// Helper function to parse markdown and citations into JSX
function parseMarkdownWithCitations(text: string, sources: string[]): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let keyIndex = 0;

  const processParagraph = (paragraph: string): React.ReactNode => {
    if (!paragraph.trim()) return null;

    const processInline = (str: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let remaining = str;
      let partKey = 0;

      while (remaining) {
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        const citationMatch = remaining.match(/\[(\d+)\]/);

        if (boldMatch && (!citationMatch || boldMatch.index! <= citationMatch.index!)) {
          if (boldMatch.index! > 0) {
            parts.push(<span key={partKey++}>{remaining.slice(0, boldMatch.index)}</span>);
          }
          parts.push(<strong key={partKey++} className="font-bold text-gray-900">{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
        } else if (citationMatch) {
          if (citationMatch.index! > 0) {
            parts.push(<span key={partKey++}>{remaining.slice(0, citationMatch.index)}</span>);
          }
          const citationNum = parseInt(citationMatch[1]);
          const sourceUrl = sources[citationNum - 1];
          if (sourceUrl) {
            parts.push(
              <a
                key={partKey++}
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors mx-0.5 align-super"
                title={sourceUrl}
              >
                {citationNum}
              </a>
            );
          } else {
            parts.push(<sup key={partKey++} className="text-blue-600">[{citationNum}]</sup>);
          }
          remaining = remaining.slice(citationMatch.index! + citationMatch[0].length);
        } else {
          parts.push(<span key={partKey++}>{remaining}</span>);
          break;
        }
      }

      return parts;
    };

    return <span>{processInline(paragraph)}</span>;
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        elements.push(
          <p key={keyIndex++} className="text-gray-700 leading-relaxed mb-3">
            {processParagraph(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      elements.push(
        <h4 key={keyIndex++} className="font-bold text-gray-900 mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
          {processParagraph(trimmedLine.slice(4))}
        </h4>
      );
    } else if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      elements.push(
        <h3 key={keyIndex++} className="font-bold text-lg text-gray-900 mt-4 mb-2 border-b border-gray-200 pb-1">
          {processParagraph(trimmedLine.slice(3))}
        </h3>
      );
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
      flushParagraph();
      elements.push(
        <div key={keyIndex++} className="flex items-start gap-2 ml-2 mb-1">
          <span className="text-purple-500 mt-1.5">•</span>
          <span className="text-gray-700">{processParagraph(trimmedLine.slice(2))}</span>
        </div>
      );
    } else if (trimmedLine === '') {
      flushParagraph();
    } else {
      currentParagraph.push(trimmedLine);
    }
  }

  flushParagraph();
  return elements;
}

// Streaming text component that reveals text progressively
function StreamingText({
  text,
  sources,
  speed = 10, // characters per frame
  onComplete
}: {
  text: string;
  sources: string[];
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedLength >= text.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      // Reveal more characters (speed up as we progress)
      const remaining = text.length - displayedLength;
      const increment = Math.min(speed, Math.ceil(remaining / 20) + speed);
      setDisplayedLength(prev => Math.min(prev + increment, text.length));
    }, 16); // ~60fps

    return () => clearTimeout(timer);
  }, [displayedLength, text.length, speed, onComplete]);

  // Show the current portion of text
  const displayedText = text.slice(0, displayedLength);

  return (
    <div className="space-y-1">
      {parseMarkdownWithCitations(displayedText, sources)}
      {!isComplete && (
        <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
      )}
    </div>
  );
}

export function LiveSearchResult({
  answer,
  sources,
  quotaRemaining,
  quotaLimit,
  error,
  message
}: LiveSearchResultProps) {
  const [showSources, setShowSources] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  // Handle error state
  if (error) {
    return (
      <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2">
        <div className="bg-red-500 text-white p-3 border-b-4 border-black flex items-center gap-2">
          <AlertCircle size={20} />
          <span className="font-bold">Search Error</span>
        </div>
        <div className="p-4">
          <p className="text-red-700">{message || "An error occurred while searching."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 border-b-4 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={20} className={!streamComplete ? "animate-pulse" : ""} />
          <span className="font-bold">Live Search Results</span>
          {!streamComplete && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded animate-pulse">
              streaming...
            </span>
          )}
        </div>
        {quotaRemaining !== undefined && quotaLimit !== undefined && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {quotaRemaining}/{quotaLimit} searches remaining
          </span>
        )}
      </div>

      {/* Streaming Content */}
      <div className="p-4 border-b-2 border-gray-200 min-h-[100px]">
        <StreamingText
          text={answer || ""}
          sources={sources}
          speed={15}
          onComplete={() => {
            setStreamComplete(true);
            setShowSources(true);
          }}
        />
      </div>

      {/* Sources Section - Animated in after streaming completes */}
      {showSources && sources.length > 0 && (
        <div className="p-4 bg-gradient-to-b from-gray-50 to-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-sm text-gray-700">Sources</span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              {sources.length} references
            </span>
          </div>
          <div className="grid gap-2">
            {sources.slice(0, 8).map((source, i) => (
              <a
                key={i}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-all group animate-in fade-in slide-in-from-left duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full group-hover:bg-blue-200">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                    {getDomain(source)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{source}</p>
                </div>
                <ExternalLink size={14} className="flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 bg-purple-50 border-t-2 border-purple-200 text-xs text-purple-600 flex items-center gap-1">
        <Sparkles size={12} className={!streamComplete ? "animate-spin" : ""} />
        Powered by Perplexity AI • Real-time web search
      </div>
    </div>
  );
}
