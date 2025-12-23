"use client";

import { useAudioPlayer, formatTime } from "@/hooks/useAudioPlayer";
import { SpeedSelector } from "./SpeedSelector";
import { Play, Pause, RotateCcw, RotateCw, Loader2, AlertCircle } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
}

export function AudioPlayer({ audioUrl, duration: estimatedDuration }: AudioPlayerProps) {
  const {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    playbackRate,
    toggle,
    seek,
    seekByPercent,
    setPlaybackRate,
    error,
  } = useAudioPlayer(audioUrl);

  const actualDuration = duration || estimatedDuration || 0;

  const handleSkip = (seconds: number) => {
    seek(Math.max(0, Math.min(actualDuration, currentTime + seconds)));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekByPercent(percent);
  };

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 border-2 border-red-300">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div
        className="h-4 bg-gray-200 border-2 border-black cursor-pointer relative group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-md transition-transform group-hover:scale-110"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-sm font-mono text-gray-600">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(actualDuration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Skip Back */}
        <button
          onClick={() => handleSkip(-15)}
          className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
          title="Back 15s"
        >
          <RotateCcw size={24} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={toggle}
          disabled={isLoading}
          className="p-4 bg-black text-white border-4 border-black hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? (
            <Loader2 size={32} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={32} />
          ) : (
            <Play size={32} />
          )}
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => handleSkip(15)}
          className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
          title="Forward 15s"
        >
          <RotateCw size={24} />
        </button>
      </div>

      {/* Speed Control */}
      <SpeedSelector currentSpeed={playbackRate} onSpeedChange={setPlaybackRate} />
    </div>
  );
}
