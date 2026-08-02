import { useCallback, useEffect, useRef } from 'react';
import { Track } from '@/constants/tracks';
import { useAnalytics } from '@/hooks/use-analytics';

export interface ChantSession {
  handleComplete: () => void;
  progressRef: React.MutableRefObject<number>;
  durationRef: React.MutableRefObject<number>;
}

export function useChantSession(track: Track, onComplete?: () => void): ChantSession {
  const analytics = useAnalytics();
  const completedRef = useRef(false);
  const progressRef = useRef(0);
  const durationRef = useRef(0);

  const handleComplete = useCallback(() => {
    completedRef.current = true;
    analytics.capture({ type: 'chant_completed', trackId: track.id, durationMs: durationRef.current });
    onComplete?.();
  }, [onComplete, analytics, track.id]);

  useEffect(() => {
    completedRef.current = false;
    analytics.capture({ type: 'chant_started', trackId: track.id });
    return () => {
      if (!completedRef.current) {
        analytics.capture({
          type: 'chant_abandoned',
          trackId: track.id,
          progressPercent: Math.round(progressRef.current * 100),
        });
      }
    };
  }, [analytics, track.id]);

  return { handleComplete, progressRef, durationRef };
}
