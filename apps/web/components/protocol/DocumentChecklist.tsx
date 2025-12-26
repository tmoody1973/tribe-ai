"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FileText, Check, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface Document {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: number;
}

interface DocumentChecklistProps {
  protocolId: Id<"protocols">;
  corridorId: Id<"corridors">;
  stepTitle: string;
  stepDescription: string;
  stepCategory: string;
  corridorOrigin: string;
  corridorDestination: string;
}

export function DocumentChecklist({
  protocolId,
  corridorId,
  stepTitle,
  stepDescription,
  stepCategory,
  corridorOrigin,
  corridorDestination,
}: DocumentChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Fetch existing checklist
  const existingChecklist = useQuery(api.documentChecklists.getChecklist, { protocolId });
  const saveChecklist = useMutation(api.documentChecklists.saveChecklist);
  const toggleDocument = useMutation(api.documentChecklists.toggleDocument);

  // Load existing documents when checklist is fetched
  useEffect(() => {
    if (existingChecklist?.documents) {
      setDocuments(existingChecklist.documents);
    }
  }, [existingChecklist]);

  const generateDocuments = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepContext: {
            stepTitle,
            stepDescription,
            stepCategory,
            corridorOrigin,
            corridorDestination,
          },
        }),
      });

      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
        // Save to database
        await saveChecklist({
          protocolId,
          corridorId,
          documents: data.documents,
        });
      }
    } catch (error) {
      console.error("Failed to generate documents:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = async (documentId: string) => {
    // Optimistic update
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, completed: !doc.completed, completedAt: !doc.completed ? Date.now() : undefined }
          : doc
      )
    );

    try {
      await toggleDocument({ protocolId, documentId });
    } catch (error) {
      console.error("Failed to toggle document:", error);
      // Revert on error
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? { ...doc, completed: !doc.completed }
            : doc
        )
      );
    }
  };

  const completedCount = documents.filter((d) => d.completed).length;
  const requiredCount = documents.filter((d) => d.required).length;
  const requiredCompletedCount = documents.filter((d) => d.required && d.completed).length;

  return (
    <div className="border-2 border-black bg-white mt-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-purple-600" />
          <span className="font-bold text-sm">Document Checklist</span>
          {documents.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {completedCount}/{documents.length}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t-2 border-black p-3">
          {documents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-3">
                Generate a personalized document checklist for this step
              </p>
              <button
                onClick={generateDocuments}
                disabled={isGenerating}
                className={`
                  inline-flex items-center gap-2 px-4 py-2
                  bg-purple-500 text-white font-bold text-sm
                  border-2 border-black shadow-[2px_2px_0_0_#000]
                  hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]
                  transition-all
                  ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Generate Checklist
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              {requiredCount > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Required documents</span>
                    <span className="font-bold">
                      {requiredCompletedCount}/{requiredCount}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 border border-black">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(requiredCompletedCount / requiredCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Document list */}
              <div className="space-y-2">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className={`
                      flex items-start gap-3 p-2 cursor-pointer
                      border border-gray-200 rounded
                      hover:bg-gray-50 transition-colors
                      ${doc.completed ? "bg-green-50 border-green-300" : ""}
                    `}
                  >
                    <button
                      onClick={() => handleToggle(doc.id)}
                      className={`
                        flex-shrink-0 w-5 h-5 mt-0.5
                        border-2 border-black flex items-center justify-center
                        ${doc.completed ? "bg-green-500" : "bg-white"}
                      `}
                    >
                      {doc.completed && <Check size={14} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium text-sm ${
                            doc.completed ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {doc.name}
                        </span>
                        {doc.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Regenerate button */}
              <button
                onClick={generateDocuments}
                disabled={isGenerating}
                className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                Regenerate list
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
