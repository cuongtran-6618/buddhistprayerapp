import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STREAK_MAX_DAYS } from "@/constants/animation";
import { HEATMAP_MAX_DAYS, getNextMilestone } from "@/constants/milestones";
import { formatDateKey } from "@/utils/date";

// { "2026-03-29": { "chu-dai-bi": 2, "nam-mo": 1 } }
type DayRecord = { [trackId: string]: number };
type HistoryMap = { [dateKey: string]: DayRecord };

interface ChantingHistoryStore {
  history: HistoryMap;
  /** Highest milestone celebrated for the current unbroken streak run (0 = none yet). Resets when the streak breaks. */
  celebratedForCurrentRun: number;
  recordCompletion: (trackId: string) => void;
  getCompletionsForDate: (dateKey: string) => DayRecord;
  /** Checks the current streak against milestones and returns the newly-crossed one, if any. */
  checkMilestone: () => number | null;
  /** DEV ONLY: seed N days of varied fake history ending today. */
  seedHistory: (days: number, trackIds?: string[]) => void;
}

function getTodayKey(): string {
  return formatDateKey(new Date());
}

export const useChantingHistoryStore = create<ChantingHistoryStore>()(
  persist(
    (set, get) => ({
      history: {},
      celebratedForCurrentRun: 0,

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

      seedHistory: (days, trackIds = ['chu-dai-bi']) => {
        const history: HistoryMap = {};
        const cursor = new Date();
        for (let i = 0; i < days; i++) {
          // ~85% attendance rate — realistic for a motivated practitioner
          if (Math.random() > 0.15) {
            const daily: DayRecord = {};
            // Pick 1–3 tracks randomly
            const shuffled = [...trackIds].sort(() => Math.random() - 0.5);
            const trackCount = Math.min(shuffled.length, Math.ceil(Math.random() * 3));
            for (const id of shuffled.slice(0, trackCount)) {
              daily[id] = Math.ceil(Math.random() * 2); // 1–2 completions each
            }
            history[formatDateKey(cursor)] = daily;
          }
          cursor.setDate(cursor.getDate() - 1);
        }
        set({ history, celebratedForCurrentRun: 0 });
      },

      checkMilestone: () => {
        const { history, celebratedForCurrentRun } = get();
        const result = computeMilestoneCrossing(computeStreak(history), celebratedForCurrentRun);
        if (result.celebratedForCurrentRun !== celebratedForCurrentRun) {
          set({ celebratedForCurrentRun: result.celebratedForCurrentRun });
        }
        return result.crossed;
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

export function computeMilestoneCrossing(
  currentStreak: number,
  celebratedForCurrentRun: number
): { crossed: number | null; celebratedForCurrentRun: number } {
  // A streak shorter than what we've already celebrated means the run broke and restarted.
  const baseline = currentStreak < celebratedForCurrentRun ? 0 : celebratedForCurrentRun;
  const next = getNextMilestone(baseline);

  if (currentStreak >= next) {
    return { crossed: next, celebratedForCurrentRun: next };
  }
  return { crossed: null, celebratedForCurrentRun: baseline };
}

export interface HeatmapCell {
  dateKey: string;
  weekday: number; // 0 = Sun ... 6 = Sat
  filled: boolean;
  count: number; // total completions that day (for intensity shading)
}

/**
 * Builds a weekday-aligned grid (columns = calendar weeks, rows = Sun..Sat)
 * covering the current streak, capped at HEATMAP_MAX_DAYS so the share-card
 * capture stays cheap for very long streaks.
 */
export function computeHeatmapGrid(history: HistoryMap, streakLength: number): (HeatmapCell | null)[][] {
  const days = Math.min(streakLength, HEATMAP_MAX_DAYS);
  if (days <= 0) return [];

  const cells: HeatmapCell[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = formatDateKey(cursor);
    const record = history[key];
    const count = record != null ? Object.values(record).reduce((s, c) => s + c, 0) : 0;
    cells.push({ dateKey: key, weekday: cursor.getDay(), filled: count > 0, count });
    cursor.setDate(cursor.getDate() + 1);
  }

  const columns: (HeatmapCell | null)[][] = [];
  let column: (HeatmapCell | null)[] = new Array(7).fill(null);
  for (const cell of cells) {
    column[cell.weekday] = cell;
    if (cell.weekday === 6) {
      columns.push(column);
      column = new Array(7).fill(null);
    }
  }
  if (column.some((c) => c !== null)) columns.push(column);

  return columns;
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
