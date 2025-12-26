"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getCountryByCode } from "@/lib/constants/countries";
import {
  ChevronDown,
  Plus,
  Check,
  Trash2,
  Pencil,
  X,
  Map,
  Loader2,
} from "lucide-react";

interface JourneyWithStats {
  _id: Id<"corridors">;
  origin: string;
  destination: string;
  stage: string;
  name?: string;
  isPrimary?: boolean;
  protocolCount: number;
  completedCount: number;
  progress: number;
}

interface JourneySwitcherProps {
  onAddJourney?: () => void;
}

export function JourneySwitcher({ onAddJourney }: JourneySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"corridors"> | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"corridors"> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const journeys = useQuery(api.corridors.getAllJourneys) as JourneyWithStats[] | undefined;
  const switchPrimary = useMutation(api.corridors.switchPrimaryJourney);
  const renameJourney = useMutation(api.corridors.renameJourney);
  const deleteJourney = useMutation(api.corridors.deleteJourney);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
        setDeleteConfirm(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!journeys) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const primaryJourney = journeys.find((j) => j.isPrimary) || journeys[0];
  if (!primaryJourney) return null;

  const originCountry = getCountryByCode(primaryJourney.origin);
  const destCountry = getCountryByCode(primaryJourney.destination);

  const handleSwitch = async (corridorId: Id<"corridors">) => {
    await switchPrimary({ corridorId });
    setIsOpen(false);
  };

  const handleRename = async (corridorId: Id<"corridors">) => {
    if (!editName.trim()) return;
    await renameJourney({ corridorId, name: editName.trim() });
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async (corridorId: Id<"corridors">) => {
    await deleteJourney({ corridorId });
    setDeleteConfirm(null);
  };

  const startEdit = (journey: JourneyWithStats) => {
    setEditingId(journey._id);
    setEditName(journey.name || `${originCountry?.name} to ${destCountry?.name}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
      >
        <span className="text-lg">{originCountry?.flag}</span>
        <span className="font-bold text-sm hidden sm:inline">
          {primaryJourney.name || `${originCountry?.name?.slice(0, 10)}...`}
        </span>
        <span className="text-gray-400 hidden sm:inline">→</span>
        <span className="text-lg">{destCountry?.flag}</span>
        <span className="font-bold text-sm hidden sm:inline">
          {destCountry?.name?.slice(0, 10)}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border-4 border-black shadow-[4px_4px_0_0_#000] z-50">
          {/* Header */}
          <div className="px-4 py-2 bg-gray-100 border-b-2 border-black flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <Map size={16} />
              My Journeys ({journeys.length}/5)
            </span>
          </div>

          {/* Journey List */}
          <div className="max-h-64 overflow-y-auto">
            {journeys.map((journey) => {
              const origin = getCountryByCode(journey.origin);
              const dest = getCountryByCode(journey.destination);
              const isEditing = editingId === journey._id;
              const isDeleting = deleteConfirm === journey._id;

              return (
                <div
                  key={journey._id}
                  className={`px-4 py-3 border-b border-gray-200 ${
                    journey.isPrimary ? "bg-amber-50" : "hover:bg-gray-50"
                  }`}
                >
                  {isDeleting ? (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600 font-medium">
                        Delete this journey? All protocols will be lost.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(journey._id)}
                          className="flex-1 px-3 py-1 bg-red-500 text-white text-sm font-bold border-2 border-black"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-1 bg-gray-200 text-sm font-bold border-2 border-black"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 border-2 border-black text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(journey._id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleRename(journey._id)}
                        className="p-1 bg-green-500 text-white border-2 border-black"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 bg-gray-200 border-2 border-black"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Click to switch */}
                      <button
                        onClick={() => !journey.isPrimary && handleSwitch(journey._id)}
                        className="flex-1 flex items-center gap-2 text-left"
                        disabled={journey.isPrimary}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xl">{origin?.flag}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-xl">{dest?.flag}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {journey.name || `${origin?.name} to ${dest?.name}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="capitalize">{journey.stage}</span>
                            <span>•</span>
                            <span>{journey.progress}% complete</span>
                          </div>
                        </div>
                        {journey.isPrimary && (
                          <span className="px-2 py-0.5 bg-amber-400 text-xs font-bold border border-black">
                            Active
                          </span>
                        )}
                      </button>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(journey)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Rename"
                        >
                          <Pencil size={14} />
                        </button>
                        {!journey.isPrimary && (
                          <button
                            onClick={() => setDeleteConfirm(journey._id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Journey Button */}
          {journeys.length < 5 && (
            <button
              onClick={() => {
                setIsOpen(false);
                onAddJourney?.();
              }}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border-t-2 border-black transition-colors"
            >
              <Plus size={18} className="text-green-600" />
              <span className="font-bold text-sm text-green-700">Add New Journey</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
