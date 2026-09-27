import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TrackPackage } from "./catalog";

const DEFAULT_MEDIA_ENDPOINT = "http://127.0.0.1:8787/api/stream";

const isDirectUrl = (value: string): boolean =>
  /^(blob:|data:|https?:\/\/)/i.test(value);

const isAbsoluteLocalPath = (value: string): boolean =>
  value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);

export const resolvePlaybackUrl = (
  track: TrackPackage,
  mediaEndpoint = DEFAULT_MEDIA_ENDPOINT,
): string | null => {
  const audio = track.assets.audio;
  if (!audio) return null;
  if (audio.runtimeUrl) return audio.runtimeUrl;
  if (isDirectUrl(audio.path)) return audio.path;
  if (isAbsoluteLocalPath(audio.path)) {
    return `${mediaEndpoint}?path=${encodeURIComponent(audio.path)}`;
  }
  return audio.path || null;
};

export const formatPlaybackTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export const useTrackPlayer = (track: TrackPackage) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => resolvePlaybackUrl(track), [track]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const played = () => setIsPlaying(true);
    const paused = () => setIsPlaying(false);
    const ended = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };
    const failed = () => {
      setError(
        "Audio source unavailable. Scan the local audio file or start the local media stream backend.",
      );
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", played);
    audio.addEventListener("pause", paused);
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", failed);

    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsPlaying(false);

    if (url) {
      audio.src = url;
      audio.load();
    } else {
      setError("No audio asset is linked to this track.");
    }

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("play", played);
      audio.removeEventListener("pause", paused);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", failed);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [track.id, url]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    try {
      setError(null);
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start playback.",
      );
    }
  }, [url]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = Math.max(
      0,
      Math.min(seconds, Number.isFinite(audio.duration) ? audio.duration : seconds),
    );
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.max(0, Math.min(1, value)));
  }, []);

  return {
    audioRef,
    url,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    toggle,
    seek,
    setVolume,
  };
};
