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
import { useI18n } from "@/lib/i18n";

export interface DashboardScheduleItem extends ScheduleItemData {
  trackTitle: string;
  track: Track | null;
}

export interface DashboardData {
  scheduleItems: DashboardScheduleItem[];
  streak: number;
  todayProgress: { done: number; total: number };
  monthPct: number;
  greeting: { main: string };
}

function getGreeting(translate: (key: string) => string): { main: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { main: translate("home.greeting_night") };
  if (hour < 12) return { main: translate("home.greeting_morning") };
  if (hour < 17) return { main: translate("home.greeting_afternoon") };
  return { main: translate("home.greeting_evening") };
}

export function useDashboard(): DashboardData {
  const i18n = useI18n();
  const reminders = useRemindersStore((state) => state.reminders);
  const history = useChantingHistoryStore((state) => state.history);
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
      greeting: getGreeting(i18n.t),
    };
  }, [reminders, history, getTrackById, i18n]);
}
