/**
 * Reminder
 *
 * Represents a single daily prayer reminder scheduled by the user.
 * Each reminder maps to one expo-notifications scheduled notification
 * and one chant track.
 */
export interface Reminder {
  /** Unique ID — Date.now().toString() at creation time. */
  id: string;
  /** Human-readable label, e.g. "Công phu khuya". */
  title: string;
  /** ID of the chant track to open when the reminder is accepted. */
  trackId: string;
  /** Hour of day (0–23) for the daily notification trigger. */
  hour: number;
  /** Minute (0–59) for the daily notification trigger. */
  minute: number;
  /** How many minutes to delay if the user taps "Snooze". */
  snoozeMinutes: 5 | 10 | 15;
  /** When false the notification is cancelled but the reminder is kept in the list. */
  enabled: boolean;
  /** The ID returned by expo-notifications when the notification was scheduled.
   *  Null when the reminder is disabled or not yet scheduled. */
  notificationId: string | null;
}
