import { useMemo } from 'react';
import { usePostHog } from 'posthog-react-native';

export function useAnalytics() {
  const posthog = usePostHog();

  return useMemo(() => ({
    trackChantStarted: (trackId: string) =>
      posthog.capture('chant_started', { track_id: trackId }),
    trackChantCompleted: (trackId: string, durationMs: number) =>
      posthog.capture('chant_completed', { track_id: trackId, duration_ms: durationMs }),
    trackChantAbandoned: (trackId: string, progressPercent: number) =>
      posthog.capture('chant_abandoned', { track_id: trackId, progress_percent: progressPercent }),
    trackChantSeeked: (trackId: string, direction: 'forward' | 'backward') =>
      posthog.capture('chant_seeked', { track_id: trackId, direction }),
    trackOnboardingCompleted: () =>
      posthog.capture('onboarding_completed'),
    trackOnboardingSkipped: (step: number) =>
      posthog.capture('onboarding_skipped', { step }),
    trackChantSelected: (trackId: string, source: 'home' | 'chant_list') =>
      posthog.capture('chant_selected', { track_id: trackId, source }),
    trackReminderCreated: () =>
      posthog.capture('reminder_created'),
    trackReminderDeleted: (reminderId: string) =>
      posthog.capture('reminder_deleted', { reminder_id: reminderId }),
    trackReminderToggled: (reminderId: string, enabled: boolean) =>
      posthog.capture('reminder_toggled', { reminder_id: reminderId, enabled }),
  }), [posthog]);
}
