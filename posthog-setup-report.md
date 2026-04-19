<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Buddhist Prayer App. The existing partial integration was extended with five new events covering the chant discovery funnel, reminder lifecycle, and onboarding drop-off. Environment variables were verified in `.env.local`, and a dashboard with five insights was created in PostHog.

## Events

| Event | Description | File |
|---|---|---|
| `app_session` | App session recorded when app goes to background, with `duration_ms` | `app/_layout.tsx` |
| `reminder_opened` | User opens app by tapping a prayer reminder notification | `app/_layout.tsx` |
| `chant_started` | User starts playing a chant, with `track_id` | `components/player-screen.tsx` |
| `chant_completed` | User finishes a chant, with `track_id` and `duration_ms` | `components/player-screen.tsx` |
| `chant_abandoned` | User leaves a chant before completion, with `track_id` and `progress_percent` | `components/player-screen.tsx` |
| `chant_seeked` | User seeks forward or backward in a chant, with `track_id` and `direction` | `components/player-screen.tsx` |
| `onboarding_completed` | User completes all onboarding slides | `components/onboarding-screen.tsx` |
| `onboarding_skipped` | User taps Skip during onboarding, with `step` (slide index) | `components/onboarding-screen.tsx` |
| `chant_selected` | User selects a chant to play, with `track_id` and `source` (`home` or `chant_list`) | `components/chant-list-screen.tsx`, `components/home-screen.tsx` |
| `reminder_created` | User saves a new prayer reminder | `components/create-reminder-screen.tsx` |
| `reminder_deleted` | User deletes a prayer reminder, with `reminder_id` | `components/reminders-screen.tsx` |
| `reminder_toggled` | User enables or disables a reminder, with `reminder_id` and `enabled` | `components/reminders-screen.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/161737/dashboard/629439
- **Chant Engagement Funnel** (chant_selected → chant_started → chant_completed): https://eu.posthog.com/project/161737/insights/xSQQ4qsy
- **Onboarding Conversion** (completed vs skipped over time): https://eu.posthog.com/project/161737/insights/xwPEGnIc
- **Daily Active Sessions** (DAU via app_session events): https://eu.posthog.com/project/161737/insights/R9lFHNlG
- **Reminder Retention** (reminders created vs deleted): https://eu.posthog.com/project/161737/insights/rU5AvXZ7
- **Chant Completion Rate** (completed vs abandoned per week): https://eu.posthog.com/project/161737/insights/VU9GdsXp

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
