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
    .filter((r) => r.enabled)
    .sort((a, b) => (a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute));

  const slotIndex: { [trackId: string]: number } = {};

  const items: ScheduleItemData[] = sorted.map((r) => {
    const idx = slotIndex[r.trackId] ?? 0;
    slotIndex[r.trackId] = idx + 1;

    const done = idx < (completions[r.trackId] ?? 0);
    const hour = String(r.hour).padStart(2, "0");
    const min = String(r.minute).padStart(2, "0");

    return { id: r.id, time: `${hour}:${min}`, label: r.title, trackId: r.trackId, done, current: false };
  });

  const firstNonDone = items.findIndex((i) => !i.done);
  if (firstNonDone >= 0) items[firstNonDone].current = true;

  return items;
}

export function computeTodayProgress(
  reminders: Reminder[],
  completions: DayRecord
): { done: number; total: number } {
  const enabled = reminders.filter((r) => r.enabled);
  const sorted = [...enabled].sort((a, b) =>
    a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute
  );

  const slotIndex: { [trackId: string]: number } = {};
  let done = 0;

  for (const r of sorted) {
    const idx = slotIndex[r.trackId] ?? 0;
    slotIndex[r.trackId] = idx + 1;
    if (idx < (completions[r.trackId] ?? 0)) done++;
  }

  return { done, total: enabled.length };
}
