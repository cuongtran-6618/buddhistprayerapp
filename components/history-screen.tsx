import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { TRACKS } from "@/constants/tracks";
import { useI18n } from "@/lib/i18n";
import { formatDateKey } from "@/utils/date";
import { computeStreak, useChantingHistoryStore } from "@/store/chanting-history-store";
import { useTracks } from "@/hooks/use-tracks";

// ── Types / helpers ───────────────────────────────────────────────────────────

type HistoryMap = Record<string, Record<string, number>>;

function findMostRecentDate(history: HistoryMap): string | null {
  return (
    Object.entries(history)
      .filter(([, r]) => Object.values(r).some((c) => c > 0))
      .sort(([a], [b]) => b.localeCompare(a))[0]?.[0] ?? null
  );
}

function formatDisplayDate(dateKey: string, locale: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const CELL = 30;

function MonthCalendar({
  year,
  month,
  history,
  selectedDate,
  onSelectDate,
  onPrev,
  onNext,
  locale,
}: {
  year: number;
  month: number; // 0-indexed
  history: HistoryMap;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  locale: string;
}) {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells: (string | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(formatDateKey(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <View>
      <View style={calStyles.navRow}>
        <Pressable onPress={onPrev} hitSlop={16}>
          <Text style={calStyles.navArrow}>‹</Text>
        </Pressable>
        <Text style={calStyles.monthTitle}>{monthLabel}</Text>
        <Pressable onPress={onNext} disabled={isCurrentMonth} hitSlop={16}>
          <Text style={[calStyles.navArrow, isCurrentMonth && calStyles.navArrowDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={calStyles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={calStyles.dayHeader}>{label}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, ri) => (
        <View key={ri} style={calStyles.weekRow}>
          {cells.slice(ri * 7, ri * 7 + 7).map((dateKey, di) => {
            if (!dateKey) return <View key={di} style={calStyles.dayCell} />;
            const record = history[dateKey];
            const completed = record != null && Object.values(record).some((c) => c > 0);
            const selected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            return (
              <Pressable key={di} style={calStyles.dayCell} onPress={() => onSelectDate(dateKey)} hitSlop={4}>
                <View
                  style={[
                    calStyles.dayCircle,
                    completed && calStyles.dayCircleCompleted,
                    selected && calStyles.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      calStyles.dayNum,
                      completed && calStyles.dayNumCompleted,
                      isToday && !completed && calStyles.dayNumToday,
                    ]}
                  >
                    {parseInt(dateKey.split("-")[2], 10)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const i18n = useI18n();
  const { locale } = i18n;
  const insets = useSafeAreaInsets();
  const history = useChantingHistoryStore((s) => s.history);
  const seedHistory = useChantingHistoryStore((s) => s.seedHistory);
  const { getTrackById } = useTracks();
  const allTrackIds = TRACKS.map((t) => t.id);

  // Initialize to most recent date with data; fall back to today
  const initialDate = findMostRecentDate(useChantingHistoryStore.getState().history);
  const initialParts = initialDate?.split("-").map(Number) ?? null;

  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [calendarYear, setCalendarYear] = useState(
    initialParts ? initialParts[0] : new Date().getFullYear()
  );
  const [calendarMonth, setCalendarMonth] = useState(
    initialParts ? initialParts[1] - 1 : new Date().getMonth()
  );

  const { totalSessions, streak, topTrackTitle } = useMemo(() => {
    let total = 0;
    const countByTrack: Record<string, number> = {};
    for (const record of Object.values(history)) {
      for (const [trackId, count] of Object.entries(record)) {
        total += count;
        countByTrack[trackId] = (countByTrack[trackId] ?? 0) + count;
      }
    }
    let topTrackId = "";
    let topCount = 0;
    for (const [id, count] of Object.entries(countByTrack)) {
      if (count > topCount) { topCount = count; topTrackId = id; }
    }
    return {
      totalSessions: total,
      streak: computeStreak(history),
      topTrackTitle: topTrackId ? (getTrackById(topTrackId)?.title ?? "—") : "—",
    };
  }, [history, getTrackById]);

  const handleCalendarSelect = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
  }, []);

  const goToPrevMonth = useCallback(() => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }, [calendarMonth, calendarYear]);

  const goToNextMonth = useCallback(() => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }, [calendarMonth, calendarYear]);

  const selectedRecord = selectedDate ? history[selectedDate] : null;
  const selectedEntries = selectedRecord
    ? Object.entries(selectedRecord).filter(([, c]) => c > 0)
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky top: heading + stats + calendar */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>{i18n.t("history.heading")}</Text>
          <Pressable style={styles.seedButton} onPress={() => seedHistory(90, allTrackIds)}>
            <Text style={styles.seedButtonText}>Seed 3mo</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>{i18n.t("history.stat_sessions")}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>{i18n.t("history.stat_streak")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueSmall} numberOfLines={2}>{topTrackTitle}</Text>
            <Text style={styles.statLabel}>{i18n.t("history.stat_top")}</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <MonthCalendar
            year={calendarYear}
            month={calendarMonth}
            history={history}
            selectedDate={selectedDate}
            onSelectDate={handleCalendarSelect}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
            locale={locale}
          />
        </View>
      </View>

      {/* Scrollable filtered list */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {selectedDate === null ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{i18n.t("history.empty_title")}</Text>
            <Text style={styles.emptyBody}>{i18n.t("history.empty_body")}</Text>
          </View>
        ) : selectedEntries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{i18n.t("history.empty_day_title")}</Text>
            <Text style={styles.emptyBody}>{i18n.t("history.empty_day_body")}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.dateLabel}>{formatDisplayDate(selectedDate, locale)}</Text>
            {selectedEntries.map(([trackId, count]) => {
              const track = getTrackById(trackId);
              return (
                <View key={trackId} style={styles.row}>
                  <Text style={styles.trackTitle}>{track?.title ?? trackId}</Text>
                  <Text style={styles.count}>×{count}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const calStyles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navArrow: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.gold, paddingHorizontal: 4 },
  navArrowDisabled: { color: Colors.muted },
  monthTitle: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.cream },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.muted,
    paddingBottom: 4,
  },
  dayCell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayCircle: {
    width: CELL,
    height: CELL,
    borderRadius: CELL / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayCircleCompleted: { backgroundColor: Colors.gold },
  dayCircleSelected: { borderColor: Colors.goldBright },
  dayNum: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.muted },
  dayNumCompleted: { color: Colors.bg },
  dayNumToday: { color: Colors.gold },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Top section (sticky) ──
  topSection: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  heading: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.cream },
  seedButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seedButtonText: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.muted },

  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 2,
  },
  statCardMiddle: { borderColor: Colors.goldDim },
  statValue: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.goldBright },
  statValueSmall: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.goldBright,
    textAlign: "center",
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 12,
  },

  // ── List section (scrollable) ──
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },

  empty: { alignItems: "center", marginTop: 40, gap: 6 },
  emptyTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.cream },
  emptyBody: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, textAlign: "center" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  dateLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.gold,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  trackTitle: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.cream, flex: 1 },
  count: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.muted },
});
