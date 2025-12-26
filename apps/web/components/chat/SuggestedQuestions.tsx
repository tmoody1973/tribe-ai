"use client";

import { useMemo } from "react";
import { MessageSquare, Sparkles } from "lucide-react";

interface Protocol {
  _id: string;
  title: string;
  category: string;
  status: string;
}

interface SuggestedQuestionsProps {
  origin?: string;
  destination?: string;
  stage?: string;
  currentProtocol?: Protocol | null;
  onSelectQuestion: (question: string) => void;
}

export function SuggestedQuestions({
  origin,
  destination,
  stage,
  currentProtocol,
  onSelectQuestion,
}: SuggestedQuestionsProps) {
  const suggestions = useMemo(() => {
    const questions: string[] = [];

    // Protocol-specific questions
    if (currentProtocol) {
      switch (currentProtocol.category) {
        case "visa":
          questions.push(
            `What documents do I need for ${currentProtocol.title}?`,
            `How long does ${currentProtocol.title.toLowerCase()} take?`,
            `What are common mistakes to avoid?`
          );
          break;
        case "finance":
          questions.push(
            `How much money do I need to show?`,
            `What's the best way to transfer money to ${destination}?`,
            `Are there any hidden costs?`
          );
          break;
        case "housing":
          questions.push(
            `What's the average rent in ${destination}?`,
            `How do I find housing before I arrive?`,
            `What should I look for in a rental?`
          );
          break;
        case "employment":
          questions.push(
            `Can I work while my visa is processing?`,
            `What's the job market like in ${destination}?`,
            `How do I get my qualifications recognized?`
          );
          break;
        case "health":
          questions.push(
            `What vaccinations do I need?`,
            `How does healthcare work in ${destination}?`,
            `Do I need health insurance?`
          );
          break;
        case "legal":
          questions.push(
            `What documents need to be translated?`,
            `Do I need apostille certification?`,
            `How do I get a police clearance?`
          );
          break;
        default:
          questions.push(
            `What should I know about ${currentProtocol.title}?`,
            `What's the first thing I should do?`
          );
      }
    }

    // Stage-specific questions
    if (stage && questions.length < 4) {
      switch (stage) {
        case "dreaming":
          questions.push(`Is ${destination} a good choice for me?`);
          break;
        case "planning":
          questions.push(`What's my timeline for moving to ${destination}?`);
          break;
        case "preparing":
          questions.push(`What should I pack for ${destination}?`);
          break;
        case "relocating":
          questions.push(`What do I do on my first day in ${destination}?`);
          break;
        case "settling":
          questions.push(`How do I meet people in ${destination}?`);
          break;
      }
    }

    // General corridor questions as fallback
    if (questions.length < 3 && origin && destination) {
      questions.push(
        `What's the cost of living difference?`,
        `What's the culture shock like?`,
        `How long can I stay on my visa?`
      );
    }

    return questions.slice(0, 4); // Max 4 suggestions
  }, [origin, destination, stage, currentProtocol]);

  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-purple-500" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          Suggested Questions
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5
              text-sm text-gray-700 bg-white
              border-2 border-black shadow-[2px_2px_0_0_#000]
              hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]
              active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
              transition-all cursor-pointer
            "
          >
            <MessageSquare size={12} />
            <span className="truncate max-w-[200px]">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
