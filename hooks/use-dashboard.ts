import { useMemo } from "react";

import { Track } from "@/constants/tracks";
import { ScheduleItemData, computeScheduleStatus, computeTodayProgress } from "@/lib/schedule";
import { useTracks } from "@/hooks/use-tracks";
import {
  computeMonthProgress,
  computeStreak,
  useChantingHistoryStore,
} from "@/store/chanting-history-store";
import { useRemindersStore } from "@/store/reminders-store";
import { formatDateKey } from "@/utils/date";

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
  const { getTrackById } = useTracks();

  return useMemo(() => {
    const todayCompletions = history[formatDateKey(new Date())] ?? {};
    const baseItems = computeScheduleStatus(reminders, todayCompletions);

    const scheduleItems: DashboardScheduleItem[] = baseItems.map((item) => {
      const track = getTrackById(item.trackId);
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
