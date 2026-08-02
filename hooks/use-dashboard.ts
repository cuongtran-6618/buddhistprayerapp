import { useMemo } from "react";

import { Track, TRACKS } from "@/constants/tracks";
import { ScheduleItemData, computeScheduleStatus, computeTodayProgress } from "@/lib/schedule";
import {
  computeMonthProgress,
  computeStreak,
  getTodayKey,
  useChantingHistoryStore,
} from "@/store/chanting-history-store";
import { useRemindersStore } from "@/store/reminders-store";

export interface DashboardScheduleItem extends ScheduleItemData {
  trackTitle: string;
  track: Track | null;
}

export interface DashboardData {
  scheduleItems: DashboardScheduleItem[];
  streak: number;
  todayProgress: { done: number; total: number };
  monthPct: number;
  greeting: { vi: string; en: string };
}

function getGreeting(): { vi: string; en: string } {
  const h = new Date().getHours();
  if (h < 6) return { vi: "Khuya tĩnh lặng", en: "Peaceful night" };
  if (h < 12) return { vi: "Buổi sáng an lành", en: "Good morning" };
  if (h < 17) return { vi: "Buổi trưa bình an", en: "Good afternoon" };
  return { vi: "Buổi tối thanh tịnh", en: "Good evening" };
}

export function useDashboard(): DashboardData {
  const reminders = useRemindersStore((s) => s.reminders);
  const history = useChantingHistoryStore((s) => s.history);

  return useMemo(() => {
    const todayCompletions = history[getTodayKey()] ?? {};
    const baseItems = computeScheduleStatus(reminders, todayCompletions);

    const scheduleItems: DashboardScheduleItem[] = baseItems.map((item) => {
      const track = TRACKS.find((t) => t.id === item.trackId) ?? null;
      return { ...item, trackTitle: track?.title ?? item.trackId, track };
    });

    return {
      scheduleItems,
      streak: computeStreak(history),
      todayProgress: computeTodayProgress(reminders, todayCompletions),
      monthPct: computeMonthProgress(history),
      greeting: getGreeting(),
    };
  }, [reminders, history]);
}
