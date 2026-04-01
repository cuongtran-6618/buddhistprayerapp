/**
 * The hook wraps Expo's audio player functionality to provide a clean API for playing prayer tracks with synchronized lyrics/timing. 
 * It's designed to work with the app's Track objects that contain audio files and scripts (lyrics with timestamps).
 */
import { Track } from '@/constants/tracks';
import { setAudioModeAsync, useAudioPlayerStatus, useAudioPlayer as useExpoAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

export interface AudioPlayer {
  playing: boolean; // Indicating if audio is playing
  progress: number; // Playback progress (0-1)
  durationMs: number; // Total duration of the track in milliseconds
  activeLineIndex: number; // Index of the currently active script line based on playback time
  togglePlay: () => void; // Toggle between play and pause
  seekToLine: (index: number) => void; // Seek to a specific line in the script based on its index
  seekTo: (ms: number) => void;   // public API stays in ms for callers
}

export function useAudioPlayer(track: Track | null, onComplete?: () => void): AudioPlayer {
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const wasPlayingRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Reload when track changes; reset completion guards
  useEffect(() => {
    completedRef.current = false;
    wasPlayingRef.current = false;
    if (!track) return;
    const source = track.audio.type === 'local'
      ? track.audio.asset
      : { uri: track.audio.uri };
    player.replace(source);
  }, [track?.id]);

  // Detect natural playback end (playing → stopped near duration)
  useEffect(() => {
    if (!onComplete) return;
    const currentMs = (status.currentTime ?? 0) * 1000;
    const durationMs = (status.duration ?? 0) * 1000;
    const finished =
      wasPlayingRef.current &&
      !(status.playing ?? false) &&
      durationMs > 0 &&
      currentMs >= durationMs - 1000;
    if (finished && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
    wasPlayingRef.current = status.playing ?? false;
  }, [status.playing, status.currentTime, status.duration, onComplete]);

  // expo-audio uses seconds; we expose milliseconds to keep PlayerScreen unchanged
  const currentMs  = (status.currentTime ?? 0) * 1000;
  const durationMs = (status.duration    ?? 0) * 1000;
  const progress   = durationMs > 0 ? currentMs / durationMs : 0;

  const script = track?.script ?? [];
  let activeLineIndex = 0;
  for (let i = script.length - 1; i >= 0; i--) {
    if (script[i].startMs <= currentMs) { activeLineIndex = i; break; }
  }

  return {
    playing: status.playing ?? false,
    progress,
    durationMs,
    activeLineIndex,
    togglePlay: () => { status.playing ? player.pause() : player.play(); },
    seekToLine: (index) => {
      const ms = script[Math.max(0, Math.min(index, script.length - 1))]?.startMs ?? 0;
      player.seekTo(ms / 1000);
    },
    seekTo: (ms) => { player.seekTo(ms / 1000); },
  };
}
