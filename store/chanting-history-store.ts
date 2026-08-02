import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STREAK_MAX_DAYS } from "@/constants/animation";
import { formatDateKey } from "@/utils/date";

// { "2026-03-29": { "chu-dai-bi": 2, "nam-mo": 1 } }
type DayRecord = { [trackId: string]: number };
type HistoryMap = { [dateKey: string]: DayRecord };

interface ChantingHistoryStore {
  history: HistoryMap;
  recordCompletion: (trackId: string) => void;
  getCompletionsForDate: (dateKey: string) => DayRecord;
}

function getTodayKey(): string {
  return formatDateKey(new Date());
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

  while (streak < STREAK_MAX_DAYS) {
    const key = formatDateKey(cursor);
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
    const key = formatDateKey(new Date(year, month, day));
    const record = history[key];
    if (record && Object.values(record).some((c) => c > 0)) daysWithCompletion++;
  }

  return today > 0 ? Math.round((daysWithCompletion / today) * 100) : 0;
}
