/**
 * useSeekGesture
 *
 * Encapsulates all PanResponder logic for a drag-to-seek progress bar.
 *
 * Behaviour:
 *   - Bar and thumb position track the finger live during drag.
 *   - Audio seek fires only on finger release (onPanResponderRelease).
 *   - If the OS steals the gesture (e.g. system swipe), state resets
 *     without seeking so playback is uninterrupted.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
} from "react-native";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UseSeekGestureOptions {
  /** Total track length in milliseconds. */
  durationMs: number;
  /** Current playback progress as a 0–1 ratio (from useAudioPlayer). */
  currentProgress: number;
  /** Called with the target time in ms when the user lifts their finger. */
  onSeek: (ms: number) => void;
}

export interface UseSeekGestureResult {
  /** Spread onto the seek-area View: `{...seek.panHandlers}` */
  panHandlers: object;
  /** Pass to the seek-area View's `onLayout` prop to capture its pixel width. */
  handleLayout: (e: LayoutChangeEvent) => void;
  /**
   * 0–1 progress value for the fill bar and thumb position.
   * Follows the finger live while dragging; equals `currentProgress` otherwise.
   */
  displayProgress: number;
  /** True while the user's finger is down on the seek area. */
  isDragging: boolean;
}

// ─── Internal types ───────────────────────────────────────────────────────────

/**
 * Single atomic state — every PanResponder callback issues one setState call
 * so React never renders a frame where isDragging is true but dragProgress is
 * still 0 (which would cause the bar to jump to the start on touch-down).
 *
 * seekTargetProgress: set to the seek position on release, cleared once the
 * audio player's reported currentProgress catches up. This bridges the ~1s
 * gap where expo-audio briefly reports currentTime = 0 mid-seek, which would
 * otherwise cause the thumb to flash back to the start.
 */
type DragState = {
  isDragging: boolean;
  /** Follows the finger on every move — drives the bar fill and thumb. */
  dragProgress: number;
  /**
   * Non-null from the moment the finger lifts until the audio player confirms
   * the seeked position. While non-null, displayProgress is pinned to this
   * value instead of currentProgress to avoid the transient-zero flash.
   */
  seekTargetProgress: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}

/** Convert milliseconds → "M:SS" label. */
export function msToLabel(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSeekGesture({
  durationMs,
  currentProgress,
  onSeek,
}: UseSeekGestureOptions): UseSeekGestureResult {
  // Width of the rendered seek area — captured via onLayout.
  const barWidthRef = useRef(0);

  // Live refs so PanResponder callbacks always see the latest values without
  // the PanResponder needing to be recreated on each render.
  const durationRef = useRef(durationMs);
  const onSeekRef = useRef(onSeek);
  durationRef.current = durationMs;
  onSeekRef.current = onSeek;

  // Single atomic drag state — both fields always update together so there
  // is no intermediate render where they are out of sync.
  const [drag, setDrag] = useState<DragState>({
    isDragging: false,
    dragProgress: 0,
    seekTargetProgress: null,
  });

  /** Convert a touch X position (relative to the seekArea View) to 0–1. */
  const toProgress = (locationX: number): number =>
    clamp(locationX / (barWidthRef.current || 1), 0, 1);

  // PanResponder stored in a ref — stable identity across renders prevents
  // the gesture from being silently dropped mid-drag during re-renders.
  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Atomic update: isDragging and dragProgress are always in sync.
        // Clear any pending seek so we immediately show the new drag position.
        const p = toProgress(evt.nativeEvent.locationX);
        setDrag({ isDragging: true, dragProgress: p, seekTargetProgress: null });
      },

      onPanResponderMove: (evt: GestureResponderEvent) => {
        const p = toProgress(evt.nativeEvent.locationX);
        setDrag((prev) => ({ ...prev, dragProgress: p }));
      },

      onPanResponderRelease: (evt: GestureResponderEvent) => {
        // Seek fires here — after the finger lifts (seek only on release).
        // seekTargetProgress pins displayProgress to p until the audio player
        // confirms the position, preventing the transient-zero flash.
        const p = toProgress(evt.nativeEvent.locationX);
        setDrag({ isDragging: false, dragProgress: p, seekTargetProgress: p });
        onSeekRef.current(p * durationRef.current);
      },

      onPanResponderTerminate: () => {
        // OS stole the gesture — reset without seeking.
        setDrag((prev) => ({ ...prev, isDragging: false }));
      },
    })
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    barWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  // Once currentProgress is within 1% of the seek target the audio player
  // has finished seeking — clear seekTargetProgress so we hand control back
  // to the real playback position.
  useEffect(() => {
    if (drag.seekTargetProgress === null) return;
    if (Math.abs(currentProgress - drag.seekTargetProgress) < 0.01) {
      setDrag((prev) => {
        // Guard against a stale closure clearing a newer seek.
        if (prev.seekTargetProgress === null) return prev;
        return { ...prev, seekTargetProgress: null };
      });
    }
  }, [currentProgress, drag.seekTargetProgress]);

  // Priority: active drag > pending seek (bridging expo-audio latency) > live playback
  const displayProgress =
    drag.isDragging          ? drag.dragProgress :
    drag.seekTargetProgress !== null ? drag.seekTargetProgress :
    currentProgress;

  return {
    panHandlers: panResponderRef.current.panHandlers,
    handleLayout,
    displayProgress,
    isDragging: drag.isDragging,
  };
}
