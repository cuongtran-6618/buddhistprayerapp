import { setAudioModeAsync, useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Track } from '@/constants/tracks';

export interface AudioPlayer {
  playing: boolean;
  progress: number;          // 0–1
  durationMs: number;
  activeLineIndex: number;
  togglePlay: () => void;
  seekToLine: (index: number) => void;
  seekTo: (ms: number) => void;   // public API stays in ms for callers
}

export function useAudioPlayer(track: Track | null): AudioPlayer {
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Reload when track changes
  useEffect(() => {
    if (!track) return;
    const source = track.audio.type === 'local'
      ? track.audio.asset
      : { uri: track.audio.uri };
    player.replace(source);
  }, [track?.id]);

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
