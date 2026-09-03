import { useCallback, useMemo } from 'react';
import { usePostHog } from 'posthog-react-native';

// Event names match existing PostHog event names exactly.
// Property keys changed from snake_case to camelCase.
export type AnalyticsEvent =
  | { type: 'chant_started'; trackId: string }
  | { type: 'chant_completed'; trackId: string; durationMs: number }
  | { type: 'chant_abandoned'; trackId: string; progressPercent: number }
  | { type: 'chant_seeked'; trackId: string; direction: 'forward' | 'backward' }
  | { type: 'onboarding_completed' }
  | { type: 'onboarding_skipped'; step: number }
  | { type: 'chant_selected'; trackId: string; source: 'home' | 'chant_list' }
  | { type: 'reminder_created' }
  | { type: 'reminder_deleted'; reminderId: string }
  | { type: 'reminder_toggled'; reminderId: string; enabled: boolean }
  | { type: 'milestone_reached'; streak: number }
  | { type: 'share_sheet_opened'; streak: number }
  | { type: 'reminder_opened'; reminderId: string }
  | { type: 'reminder_open_invalid'; reason: 'missing_track_id' | 'unknown_track_id' | 'missing_reminder_id' }
  | { type: 'app_session'; durationMs: number };

export function useAnalytics() {
  const posthog = usePostHog();
  const capture = useCallback((event: AnalyticsEvent) => {
    const { type, ...properties } = event;
    posthog.capture(type, properties);
  }, [posthog]);
  return useMemo(() => ({ capture }), [capture]);
}
