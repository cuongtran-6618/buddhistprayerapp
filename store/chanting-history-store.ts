import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Reminder } from "@/types/reminder";

// { "2026-03-29": { "chu-dai-bi": 2, "nam-mo": 1 } }
type DayRecord = { [trackId: string]: number };
type HistoryMap = { [dateKey: string]: DayRecord };

interface ChantingHistoryStore {
  history: HistoryMap;
  recordCompletion: (trackId: string) => void;
  getCompletionsForDate: (dateKey: string) => DayRecord;
}

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useChantingHistoryStore = create<ChantingHistoryStore>()(
  persist(
    (set, get) => ({
      history: {},

      recordCompletion: (trackId) => {
        const key = getTodayKey();
        set((state) => {
          const today = state.history[key] ?? {};
          return {
            history: {
              ...state.history,
              [key]: { ...today, [trackId]: (today[trackId] ?? 0) + 1 },
            },
          };
        });
      },

      getCompletionsForDate: (dateKey) => {
        return get().history[dateKey] ?? {};
      },
    }),
    {
      name: "prayer-chanting-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export interface ScheduleItemData {
  id: string;
  time: string;       // "05:00"
  label: string;      // reminder title
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

export function computeStreak(history: HistoryMap): number {
  const hasCompletion = (dateKey: string) => {
    const day = history[dateKey];
    return day != null && Object.values(day).some((c) => c > 0);
  };

  let streak = 0;
  const cursor = new Date();

  // If today has no completion, start counting from yesterday
  if (!hasCompletion(getTodayKey())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (streak < 365) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!hasCompletion(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computeMonthProgress(history: HistoryMap): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  let daysWithCompletion = 0;
  for (let day = 1; day <= today; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = history[key];
    if (record && Object.values(record).some((c) => c > 0)) daysWithCompletion++;
  }

  return today > 0 ? Math.round((daysWithCompletion / today) * 100) : 0;
}
