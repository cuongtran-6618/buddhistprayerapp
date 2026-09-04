import { Reminder } from "@/types/reminder";

type DayRecord = { [trackId: string]: number };

export interface ScheduleItemData {
  id: string;
  time: string;
  label: string;
  trackId: string;
  done: boolean;
  current: boolean;
}

export function computeScheduleStatus(
  reminders: Reminder[],
  completions: DayRecord
): ScheduleItemData[] {
  const sorted = [...reminders]
    .filter((reminder) => reminder.enabled)
    .sort((reminderA, reminderB) => (reminderA.hour !== reminderB.hour ? reminderA.hour - reminderB.hour : reminderA.minute - reminderB.minute));

  const slotIndex: { [trackId: string]: number } = {};

  const items: ScheduleItemData[] = sorted.map((reminder) => {
    const idx = slotIndex[reminder.trackId] ?? 0;
    slotIndex[reminder.trackId] = idx + 1;

    const done = idx < (completions[reminder.trackId] ?? 0);
    const hour = String(reminder.hour).padStart(2, "0");
    const min = String(reminder.minute).padStart(2, "0");

    return { id: reminder.id, time: `${hour}:${min}`, label: reminder.title, trackId: reminder.trackId, done, current: false };
  });

  const firstNonDone = items.findIndex((item) => !item.done);
  if (firstNonDone >= 0) items[firstNonDone].current = true;

  return items;
}

export function computeTodayProgress(
  reminders: Reminder[],
  completions: DayRecord
): { done: number; total: number } {
  const items = computeScheduleStatus(reminders, completions);
  return { done: items.filter((item) => item.done).length, total: items.length };
}
