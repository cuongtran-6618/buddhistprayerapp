/**
 * use-notifications
 *
 * Utility functions for expo-notifications used by the reminder feature.
 *
 * Responsibilities:
 *   - Request OS notification permission.
 *   - Register the "prayer-reminder" action category (Accept / Snooze buttons).
 *   - Schedule / cancel daily repeating reminder notifications.
 *   - Reschedule a one-time snooze notification.
 */

import * as Notifications from "expo-notifications";
import { Reminder } from "@/types/reminder";
import { i18n } from "@/lib/i18n";

// ─── Category identifier ───────────────────────────────────────────────────

const PRAYER_REMINDER_CATEGORY = "prayer-reminder";

/** Action identifier for opening the prayer. */
export const ACTION_ACCEPT = "ACCEPT";

/** Action identifier for snoozing the reminder. */
export const ACTION_SNOOZE = "SNOOZE";

// ─── Permission ───────────────────────────────────────────────────────────

/**
 * Request notification permission from the OS.
 * Returns true if permission was granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Category setup ───────────────────────────────────────────────────────

/**
 * Register the "prayer-reminder" notification category with two actions:
 *   ACCEPT — "Open Prayer"  (brings the app to the foreground)
 *   SNOOZE — "Snooze"       (handled in the background; does NOT open app)
 *
 * Call this once at app startup (in RootLayout).
 * iOS requires categories to be registered before the first notification fires.
 */
export async function setupNotificationCategory(): Promise<void> {
  // Categories are an iOS concept; Android uses action buttons directly.
  // expo-notifications handles the platform differences transparently.
  await Notifications.setNotificationCategoryAsync(PRAYER_REMINDER_CATEGORY, [
    {
      identifier: ACTION_ACCEPT,
      buttonTitle: i18n.t("notifications.open_prayer"),
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_SNOOZE,
      buttonTitle: i18n.t("notifications.snooze"),
      options: { opensAppToForeground: false },
    },
  ]);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Schedule / cancel ───────────────────────────────────────────────────

/**
 * Schedule a daily repeating notification for the given reminder.
 * Returns the expo-notifications notification ID.
 *
 * The notification content embeds the reminderId, trackId, and snoozeMinutes
 * in its data payload so the response handler in _layout.tsx can act on them
 * without querying any store.
 */
export async function scheduleReminderNotification(
  reminder: Reminder,
  trackTitle: string
): Promise<string> {
  const body = trackTitle || i18n.t("notifications.time_to_pray");

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body,
      data: {
        reminderId: reminder.id,
        trackId: reminder.trackId,
        snoozeMinutes: reminder.snoozeMinutes,
      },
      categoryIdentifier: PRAYER_REMINDER_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: reminder.hour,
      minute: reminder.minute,
      repeats: true,
    },
  });

  return notificationId;
}

/**
 * Cancel a previously scheduled notification.
 * Safe to call even if notificationId is null or already cancelled.
 */
export async function cancelReminderNotification(
  notificationId: string | null
): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// ─── Snooze ───────────────────────────────────────────────────────────────

/**
 * Schedule a one-time notification `snoozeMinutes` from now using the same
 * content as the original reminder.  The daily reminder itself is unaffected
 * and will fire again at its normal time tomorrow.
 */
export async function snoozeReminder(
  snoozeMinutes: number,
  trackId: string,
  reminderTitle: string,
  reminderId: string,
  trackTitle: string
): Promise<void> {
  const body = trackTitle || i18n.t("notifications.time_to_pray");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTitle,
      body,
      data: {
        reminderId,
        trackId,
        snoozeMinutes,
      },
      categoryIdentifier: PRAYER_REMINDER_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: snoozeMinutes * 60,
      repeats: false,
    },
  });
}
