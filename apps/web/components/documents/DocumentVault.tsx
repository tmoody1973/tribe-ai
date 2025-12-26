"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  FileText,
  Upload,
  Folder,
  Download,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react";

type DocumentCategory =
  | "passport"
  | "visa"
  | "identity"
  | "education"
  | "employment"
  | "financial"
  | "medical"
  | "legal"
  | "other";

interface UserDocument {
  _id: Id<"userDocuments">;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  displayName: string;
  description?: string;
  expiryDate?: number;
  uploadedAt: number;
}

const categoryConfig: Record<
  DocumentCategory,
  { label: string; icon: string; color: string }
> = {
  passport: { label: "Passport & Travel", icon: "passport", color: "bg-blue-100 text-blue-700" },
  visa: { label: "Visa Documents", icon: "visa", color: "bg-purple-100 text-purple-700" },
  identity: { label: "Identity Documents", icon: "id", color: "bg-green-100 text-green-700" },
  education: { label: "Education", icon: "education", color: "bg-yellow-100 text-yellow-700" },
  employment: { label: "Employment", icon: "work", color: "bg-orange-100 text-orange-700" },
  financial: { label: "Financial", icon: "money", color: "bg-emerald-100 text-emerald-700" },
  medical: { label: "Medical Records", icon: "medical", color: "bg-red-100 text-red-700" },
  legal: { label: "Legal Documents", icon: "legal", color: "bg-indigo-100 text-indigo-700" },
  other: { label: "Other", icon: "other", color: "bg-gray-100 text-gray-700" },
};


export function DocumentVault() {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | "all">("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("other");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = useQuery(api.userDocuments.listDocuments, {}) as UserDocument[] | undefined;
  const stats = useQuery(api.userDocuments.getDocumentStats);
  const expiringDocs = useQuery(api.userDocuments.getExpiringDocuments) as UserDocument[] | undefined;
  const generateUploadUrl = useMutation(api.userDocuments.generateUploadUrl);
  const saveDocument = useMutation(api.userDocuments.saveDocument);
  const deleteDocument = useMutation(api.userDocuments.deleteDocument);
  const getDocumentUrl = useQuery(
    api.userDocuments.getDocumentUrl,
    previewDoc ? { documentId: previewDoc._id } : "skip"
  );

  // Update preview URL when document changes
  if (getDocumentUrl && previewUrl !== getDocumentUrl) {
    setPreviewUrl(getDocumentUrl);
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const postUrl = await generateUploadUrl({});

      // Upload file
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await response.json();

      // Save document metadata
      await saveDocument({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: uploadCategory,
        displayName: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      });

      setShowUploadModal(false);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (docId: Id<"userDocuments">) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument({ documentId: docId });
    if (previewDoc?._id === docId) {
      setPreviewDoc(null);
      setPreviewUrl(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const daysUntilExpiry = (expiryDate: number) => {
    const days = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Filter documents
  const filteredDocs = documents?.filter((doc) => {
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory;
    const matchesSearch = searchQuery === "" ||
      doc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category for display
  const groupedDocs = filteredDocs?.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, UserDocument[]>);

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 border-b-4 border-black p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder size={24} />
            <div>
              <h2 className="font-head text-xl">Document Vault</h2>
              <p className="text-sm text-indigo-100">
                {stats?.totalCount || 0} documents • {formatFileSize(stats?.totalSize || 0)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 font-bold border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <Upload size={18} />
            Upload
          </button>
        </div>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocs && expiringDocs.length > 0 && (
        <div className="bg-amber-50 border-b-2 border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <span className="font-bold text-sm">
              {expiringDocs.length} document{expiringDocs.length > 1 ? "s" : ""} expiring soon
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {expiringDocs.slice(0, 3).map((doc) => (
              <span
                key={doc._id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded"
              >
                <Clock size={12} />
                {doc.displayName} ({daysUntilExpiry(doc.expiryDate!)} days)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="p-4 border-b-2 border-gray-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="relative">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as DocumentCategory | "all")}
            className="appearance-none px-4 py-2 pr-10 border-2 border-black bg-white font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Document Grid */}
      <div className="p-4">
        {!documents ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : filteredDocs?.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No documents yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white font-bold border-2 border-black"
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocs || {}).map(([category, docs]) => (
              <div key={category}>
                <h3 className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${categoryConfig[category as DocumentCategory].color}`}>
                    {categoryConfig[category as DocumentCategory].label}
                  </span>
                  <span className="text-gray-400">({docs.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {docs.map((doc) => (
                    <div
                      key={doc._id}
                      className="border-2 border-black bg-white p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 border border-gray-200">
                          <FileText size={24} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{doc.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.uploadedAt)}</span>
                          </div>
                          {doc.expiryDate && (
                            <div className={`mt-1 text-xs flex items-center gap-1 ${
                              daysUntilExpiry(doc.expiryDate) <= 30 ? "text-red-600" : "text-gray-500"
                            }`}>
                              <Clock size={12} />
                              Expires: {formatDate(doc.expiryDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h3 className="font-bold text-lg">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block font-bold text-sm mb-2">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 border-2 border-black"
                >
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>
              {isUploading && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h3 className="font-bold text-lg truncate">{previewDoc.displayName}</h3>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    download={previewDoc.fileName}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white font-bold border-2 border-black"
                  >
                    <Download size={16} />
                    Download
                  </a>
                )}
                <button onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}>
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {previewUrl ? (
                previewDoc.fileType === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full min-h-[60vh] border-2 border-black"
                    title={previewDoc.displayName}
                  />
                ) : previewDoc.fileType.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt={previewDoc.displayName}
                    className="max-w-full max-h-[70vh] mx-auto border-2 border-black"
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Preview not available for this file type</p>
                    <a
                      href={previewUrl}
                      download={previewDoc.fileName}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-500 text-white font-bold border-2 border-black"
                    >
                      <Download size={18} />
                      Download to View
                    </a>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
