"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Globe, Volume2, Clock, Bell, Check } from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  voices: number;
}

// Popular languages from Story 9.12
const POPULAR_LANGUAGES: Language[] = [
  { code: "en-US", name: "English (US)", nativeName: "English", voices: 8 },
  { code: "en-GB", name: "English (UK)", nativeName: "English", voices: 6 },
  { code: "en-CA", name: "English (Canada)", nativeName: "English", voices: 4 },
  { code: "fr-FR", name: "French (France)", nativeName: "Français", voices: 6 },
  { code: "fr-CA", name: "French (Canada)", nativeName: "Français", voices: 4 },
  { code: "es-ES", name: "Spanish (Spain)", nativeName: "Español", voices: 6 },
  { code: "es-MX", name: "Spanish (Mexico)", nativeName: "Español", voices: 4 },
  { code: "hi-IN", name: "Hindi (India)", nativeName: "हिन्दी", voices: 4 },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português", voices: 4 },
  { code: "pt-PT", name: "Portuguese (Portugal)", nativeName: "Português", voices: 3 },
  { code: "de-DE", name: "German", nativeName: "Deutsch", voices: 6 },
  { code: "ko-KR", name: "Korean", nativeName: "한국어", voices: 4 },
  { code: "tl-PH", name: "Tagalog", nativeName: "Tagalog", voices: 2 },
  { code: "yo-NG", name: "Yoruba", nativeName: "Yorùbá", voices: 2 },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", voices: 4 },
];

const VOICE_OPTIONS = [
  { value: "Neural2-A", label: "Voice A (Neutral)" },
  { value: "Neural2-B", label: "Voice B (Warm)" },
  { value: "Neural2-C", label: "Voice C (Professional)" },
  { value: "Neural2-D", label: "Voice D (Friendly)" },
];

const PLAYBACK_SPEEDS = [
  { value: 0.5, label: "0.5x (Slow)" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x (Normal)" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x (Fast)" },
  { value: 2, label: "2x (Very Fast)" },
];

export function BriefingSettings() {
  const preferences = useQuery(api.users.getBriefingPreferences);
  const updatePreferences = useMutation(api.users.updateBriefingPreferences);

  const [selectedLanguage, setSelectedLanguage] = useState(preferences?.language || "en-US");
  const [selectedVoice, setSelectedVoice] = useState(preferences?.voiceName || "Neural2-A");
  const [playbackSpeed, setPlaybackSpeed] = useState(preferences?.playbackSpeed || 1);
  const [dailyBriefings, setDailyBriefings] = useState(preferences?.dailyBriefings ?? true);
  const [weeklyBriefings, setWeeklyBriefings] = useState(preferences?.weeklyBriefings ?? true);
  const [briefingTime, setBriefingTime] = useState(preferences?.briefingTime || "06:00");
  const [weeklySummaryEmail, setWeeklySummaryEmail] = useState(
    preferences?.weeklySummaryEmail ?? false
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        language: selectedLanguage,
        voiceName: selectedVoice,
        playbackSpeed,
        dailyBriefings,
        weeklyBriefings,
        briefingTime,
        weeklySummaryEmail,
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-4 border-black bg-purple-100 p-4 shadow-[4px_4px_0_0_#000]">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Volume2 className="w-6 h-6" />
          Audio Briefing Settings
        </h2>
        <p className="text-sm text-gray-700 mt-1">
          Customize your daily and weekly audio briefings
        </p>
      </div>

      {/* Language Selection */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5" />
          <h3 className="font-black text-lg">Language & Voice</h3>
        </div>

        {/* Language Dropdown */}
        <div className="mb-4">
          <label className="block font-bold text-sm mb-2">Briefing Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-3 border-2 border-black font-medium"
          >
            {POPULAR_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName}) - {lang.voices} voices
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Briefings will be translated and adapted to your selected language
          </p>
        </div>

        {/* Voice Selection */}
        <div className="mb-4">
          <label className="block font-bold text-sm mb-2">Voice Style</label>
          <div className="grid grid-cols-2 gap-2">
            {VOICE_OPTIONS.map((voice) => (
              <button
                key={voice.value}
                onClick={() => setSelectedVoice(voice.value)}
                className={`p-3 border-2 border-black font-medium text-sm transition-all ${
                  selectedVoice === voice.value
                    ? "bg-purple-500 text-white shadow-[4px_4px_0_0_#000]"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {voice.label}
                {selectedVoice === voice.value && <Check className="inline ml-2" size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Speed */}
        <div>
          <label className="block font-bold text-sm mb-2">Default Playback Speed</label>
          <div className="grid grid-cols-3 gap-2">
            {PLAYBACK_SPEEDS.map((speed) => (
              <button
                key={speed.value}
                onClick={() => setPlaybackSpeed(speed.value)}
                className={`p-2 border-2 border-black font-medium text-sm transition-all ${
                  playbackSpeed === speed.value
                    ? "bg-purple-500 text-white shadow-[4px_4px_0_0_#000]"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {speed.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5" />
          <h3 className="font-black text-lg">Briefing Schedule</h3>
        </div>

        {/* Daily Briefings */}
        <div className="mb-4 flex items-center justify-between p-3 border-2 border-black">
          <div>
            <p className="font-bold">📅 Daily Briefings</p>
            <p className="text-xs text-gray-600">2-3 minute morning update</p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={dailyBriefings}
              onChange={(e) => setDailyBriefings(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-full h-full bg-gray-300 peer-checked:bg-purple-500 border-2 border-black transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border-2 border-black peer-checked:translate-x-6 transition-transform" />
          </label>
        </div>

        {/* Weekly Briefings */}
        <div className="mb-4 flex items-center justify-between p-3 border-2 border-black">
          <div>
            <p className="font-bold">📊 Weekly Briefings</p>
            <p className="text-xs text-gray-600">5-7 minute Sunday summary</p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={weeklyBriefings}
              onChange={(e) => setWeeklyBriefings(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-full h-full bg-gray-300 peer-checked:bg-purple-500 border-2 border-black transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border-2 border-black peer-checked:translate-x-6 transition-transform" />
          </label>
        </div>

        {/* Briefing Time */}
        {dailyBriefings && (
          <div className="mb-4">
            <label className="block font-bold text-sm mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Preferred Briefing Time
            </label>
            <input
              type="time"
              value={briefingTime}
              onChange={(e) => setBriefingTime(e.target.value)}
              className="w-full p-3 border-2 border-black font-medium"
            />
            <p className="text-xs text-gray-600 mt-1">Your local time zone</p>
          </div>
        )}

        {/* Email Summary */}
        <div className="flex items-center justify-between p-3 border-2 border-black">
          <div>
            <p className="font-bold">📧 Weekly Email Summary</p>
            <p className="text-xs text-gray-600">Receive summary via email</p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={weeklySummaryEmail}
              onChange={(e) => setWeeklySummaryEmail(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-full h-full bg-gray-300 peer-checked:bg-purple-500 border-2 border-black transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border-2 border-black peer-checked:translate-x-6 transition-transform" />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full p-4 bg-purple-500 hover:bg-purple-600 text-white border-4 border-black font-black text-lg shadow-[8px_8px_0_0_#000] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "💾 Save Preferences"}
      </button>

      {/* Info Box */}
      <div className="border-4 border-blue-500 bg-blue-50 p-4 shadow-[4px_4px_0_0_#000]">
        <p className="text-sm font-bold mb-2">💡 Tip</p>
        <p className="text-sm">
          Briefings use AI to synthesize information from your tasks, documents, financial data,
          corridor updates, and migration news. Changes to language and voice will apply to your
          next briefing.
        </p>
      </div>
    </div>
  );
}
