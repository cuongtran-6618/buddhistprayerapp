/**
 * The hook wraps Expo's audio player functionality to provide a clean API for playing prayer tracks with synchronized lyrics/timing. 
 * It's designed to work with the app's Track objects that contain audio files and scripts (lyrics with timestamps).
 */
import { COMPLETION_THRESHOLD_MS } from '@/constants/animation';
import { Track } from '@/constants/tracks';
import { setAudioModeAsync, useAudioPlayerStatus, useAudioPlayer as useExpoAudioPlayer } from 'expo-audio';
import { useNavigation } from 'expo-router';
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
  // Ref so the focus-effect cleanup always reads current playing state without
  // needing status.playing as a dependency (which would re-subscribe on every
  // playing-state change and fire stale cleanups mid-navigation).
  const playingRef = useRef(status.playing);
  playingRef.current = status.playing;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Pause when the user navigates away. `beforeRemove` fires synchronously
  // before React begins unmounting the screen — guaranteed before expo-audio's
  // useReleasingSharedObject cleanup destroys the native player instance.
  const navigation = useNavigation();
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (playingRef.current) {
        player.pause();
      }
    });
  }, [navigation, player]);

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
      currentMs >= durationMs - COMPLETION_THRESHOLD_MS;
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
  if (script.length > 0) {
    let lowerBound = 0;
    let upperBound = script.length - 1;
    while (lowerBound < upperBound) {
      const midpoint = (lowerBound + upperBound + 1) >> 1;
      if (script[midpoint].startMs <= currentMs) {
        lowerBound = midpoint;
      } else {
        upperBound = midpoint - 1;
      }
    }
    activeLineIndex = lowerBound;
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
