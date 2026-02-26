import { useCallback, useRef, useState } from 'react';

/**
 * Calculates millisecond seek position from drag pixel position.
 *
 * Converts pixel position relative to progress bar → normalized 0-1 → milliseconds
 * with bounds checking to ensure result is within [0, durationMs].
 *
 * @param dragPixelX - Horizontal pixel position of drag, relative to bar start
 * @param barWidth - Total width of progress bar in pixels
 * @param durationMs - Total audio duration in milliseconds
 * @returns Clamped seek position in milliseconds [0, durationMs]
 *
 * @example
 * const seekMs = calculateSeekMs(150, 300, 120000);  // 150/300 * 120000 = 60000ms
 */
export function calculateSeekMs(dragPixelX: number, barWidth: number, durationMs: number): number {
  // Guard against division by zero
  if (barWidth === 0 || durationMs === 0) return 0;

  // Clamp pixel position to valid bar range [0, barWidth]
  const clampedX = Math.max(0, Math.min(dragPixelX, barWidth));

  // Convert pixel position to normalized progress (0-1)
  const progressPercent = clampedX / barWidth;

  // Convert normalized progress to milliseconds and round to nearest integer
  const seekMs = Math.round(progressPercent * durationMs);

  return seekMs;
}

/**
 * Formats milliseconds to human-readable "M:SS" or "MM:SS" format.
 *
 * Examples:
 * - 0ms → "0:00"
 * - 5000ms → "0:05"
 * - 65000ms → "1:05"
 * - 3661000ms → "61:01" (hours displayed as minutes)
 *
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 */
export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Configuration options for the progress bar gesture hook.
 */
export interface ProgressBarGestureConfig {
  /** Width of the progress bar in pixels */
  barWidth: number;
  /** Total audio duration in milliseconds */
  durationMs: number;
  /** Callback fired when user releases drag (on touch/mouse up) */
  onSeekEnd: (ms: number) => void;
}

/**
 * Return type of the useProgressBarGesture hook.
 */
export interface ProgressBarGestureResult {
  /** True when user is actively dragging; false otherwise */
  isDragging: boolean;
  /** Normalized drag progress (0-1) during drag */
  dragPercent: number;
  /** Seek position in milliseconds during drag */
  dragMs: number;
  /** Callback for when drag starts (touch/mouse down) */
  handlePanStart: () => void;
  /** Callback for when drag moves (touch/mouse move) - call with X position relative to bar start */
  handlePanMove: (x: number) => void;
  /** Callback for when drag ends (touch/mouse up) */
  handlePanEnd: () => void;
}

/**
 * Hook for managing draggable progress bar interaction.
 *
 * Encapsulates all gesture logic: position tracking, seek calculation, and callback management.
 * Call the returned handlers from your gesture detection system (PanResponder, GestureHandler, etc.).
 *
 * **Usage Example**:
 * ```tsx
 * const { isDragging, dragMs, dragPercent, handlePanStart, handlePanMove, handlePanEnd } =
 *   useProgressBarGesture({
 *     barWidth: 300,
 *     durationMs: 180000,
 *     onSeekEnd: (ms) => player.seekTo(ms),
 *   });
 *
 * // In PanResponder onStartShouldSetResponder:
 * if (pageX >= barStartX && pageX <= barStartX + barWidth) {
 *   handlePanStart();
 * }
 *
 * // In PanResponder onMoveShouldSetResponder:
 * handlePanMove(pageX - barStartX);
 *
 * // In PanResponder onResponderRelease:
 * handlePanEnd();
 * ```
 *
 * @param config - Configuration with barWidth, durationMs, and onSeekEnd callback
 * @returns Object with isDragging, dragPercent, dragMs, and handler callbacks
 */
export function useProgressBarGesture(config: ProgressBarGestureConfig): ProgressBarGestureResult {
  const { barWidth, durationMs, onSeekEnd } = config;

  // Track whether user is currently dragging
  const [isDragging, setIsDragging] = useState(false);

  // Store current drag X position (pixel coordinate relative to bar start)
  const dragXRef = useRef<number>(0);

  /**
   * Derived values from current drag position.
   * These update on every render while isDragging or when drag position changes.
   */
  const dragMs = calculateSeekMs(dragXRef.current, barWidth, durationMs);
  const dragPercent = barWidth > 0 ? dragXRef.current / barWidth : 0;

  /**
   * Called when drag starts (touch down or mouse down on progress bar).
   * Initializes drag state.
   */
  const handlePanStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  /**
   * Called during drag with the current X position.
   * Updates stored drag position, which triggers re-render and updates dragMs/dragPercent.
   *
   * @param x - X coordinate relative to progress bar's left edge (in pixels)
   */
  const handlePanMove = useCallback((x: number) => {
    dragXRef.current = x;
  }, []);

  /**
   * Called when drag ends (touch up or mouse up).
   * Finalizes the seek action and resets drag state.
   */
  const handlePanEnd = useCallback(() => {
    // Trigger seek with the final drag position
    onSeekEnd(dragMs);
    // Reset drag state
    setIsDragging(false);
    dragXRef.current = 0;
  }, [dragMs, onSeekEnd]);

  return {
    isDragging,
    dragPercent,
    dragMs,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
}
