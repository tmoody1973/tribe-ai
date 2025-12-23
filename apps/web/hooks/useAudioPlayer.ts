"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  progress: number;
  playbackRate: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  seekByPercent: (percent: number) => void;
  setPlaybackRate: (rate: number) => void;
  error: string | null;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5];

/**
 * Hook for controlling audio playback with play/pause, seek, and speed controls
 * @param audioUrl - URL of the audio file to play
 * @returns Audio player state and controls
 */
export function useAudioPlayer(audioUrl: string | null): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element when URL changes
  useEffect(() => {
    if (!audioUrl) {
      // Reset state when no audio URL
      setIsPlaying(false);
      setIsPaused(false);
      setDuration(0);
      setCurrentTime(0);
      setError(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setIsLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError("Failed to load audio");
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioUrl]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => setError(e.message));
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      const clampedTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, []);

  const seekByPercent = useCallback(
    (percent: number) => {
      if (audioRef.current && duration > 0) {
        const time = (percent / 100) * duration;
        seek(time);
      }
    },
    [duration, seek]
  );

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current && PLAYBACK_RATES.includes(rate)) {
      audioRef.current.playbackRate = rate;
      setPlaybackRateState(rate);
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    isPlaying,
    isPaused,
    isLoading,
    duration,
    currentTime,
    progress,
    playbackRate,
    play,
    pause,
    toggle,
    seek,
    seekByPercent,
    setPlaybackRate,
    error,
  };
}

/**
 * Format seconds to mm:ss string
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Available playback rates
 */
export { PLAYBACK_RATES };
