import {
  computeHeatmapGrid,
  computeMilestoneCrossing,
  computeMonthProgress,
  computeStreak,
} from "../chanting-history-store";
import { HEATMAP_MAX_DAYS, getNextMilestone } from "@/constants/milestones";
import { computeScheduleStatus, computeTodayProgress } from "@/lib/schedule";
import { Reminder } from "@/types/reminder";
import { formatDateKey } from "@/utils/date";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysAgo(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return dateKey(date);
}

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: "r1",
    title: "Morning Prayer",
    trackId: "track-a",
    hour: 6,
    minute: 0,
    snoozeMinutes: 10,
    enabled: true,
    notificationId: null,
    ...overrides,
  };
}

// ─── formatDateKey ────────────────────────────────────────────────────────────

describe("formatDateKey", () => {
  it("returns today in YYYY-MM-DD format", () => {
    const key = formatDateKey(new Date());
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const today = new Date();
    expect(key).toBe(dateKey(today));
  });
});

// ─── computeStreak ────────────────────────────────────────────────────────────

describe("computeStreak", () => {
  it("returns 0 for empty history", () => {
    expect(computeStreak({})).toBe(0);
  });

  it("returns 0 when only a future date exists", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(computeStreak({ [dateKey(tomorrow)]: { "track-a": 1 } })).toBe(0);
  });

  it("returns 1 when only today has a completion", () => {
    const today = formatDateKey(new Date());
    expect(computeStreak({ [today]: { "track-a": 1 } })).toBe(1);
  });

  it("returns 1 when only yesterday has a completion (today is empty)", () => {
    expect(computeStreak({ [daysAgo(1)]: { "track-a": 1 } })).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    const history: Record<string, Record<string, number>> = {};
    for (let dayIndex = 0; dayIndex < 3; dayIndex++) history[daysAgo(dayIndex)] = { "track-a": 1 };
    expect(computeStreak(history)).toBe(3);
  });

  it("breaks streak at a gap", () => {
    const history: Record<string, Record<string, number>> = {
      [daysAgo(0)]: { "track-a": 1 },
      [daysAgo(1)]: { "track-a": 1 },
      // daysAgo(2) missing — gap
      [daysAgo(3)]: { "track-a": 1 },
    };
    expect(computeStreak(history)).toBe(2);
  });

  it("ignores days where all completions are 0", () => {
    const history: Record<string, Record<string, number>> = {
      [daysAgo(0)]: { "track-a": 1 },
      [daysAgo(1)]: { "track-a": 0 }, // zero count — should not count
    };
    expect(computeStreak(history)).toBe(1);
  });

  it("counts multiple tracks on same day as a single streak day", () => {
    const history: Record<string, Record<string, number>> = {
      [daysAgo(0)]: { "track-a": 2, "track-b": 1 },
      [daysAgo(1)]: { "track-a": 1 },
    };
    expect(computeStreak(history)).toBe(2);
  });
});

// ─── getNextMilestone ─────────────────────────────────────────────────────────

describe("getNextMilestone", () => {
  it("walks through the base milestones in order", () => {
    expect(getNextMilestone(0)).toBe(7);
    expect(getNextMilestone(6)).toBe(7);
    expect(getNextMilestone(7)).toBe(21);
    expect(getNextMilestone(20)).toBe(21);
    expect(getNextMilestone(21)).toBe(49);
    expect(getNextMilestone(48)).toBe(49);
    expect(getNextMilestone(49)).toBe(108);
    expect(getNextMilestone(107)).toBe(108);
  });

  it("repeats every 108 days once past the base milestones", () => {
    expect(getNextMilestone(108)).toBe(216);
    expect(getNextMilestone(216)).toBe(324);
  });
});

// ─── computeMilestoneCrossing ─────────────────────────────────────────────────

describe("computeMilestoneCrossing", () => {
  it("reports no crossing when streak hasn't reached the next milestone", () => {
    const result = computeMilestoneCrossing(6, 0);
    expect(result).toEqual({ crossed: null, celebratedForCurrentRun: 0 });
  });

  it("reports a crossing exactly at a milestone", () => {
    expect(computeMilestoneCrossing(7, 0)).toEqual({ crossed: 7, celebratedForCurrentRun: 7 });
    expect(computeMilestoneCrossing(108, 49)).toEqual({ crossed: 108, celebratedForCurrentRun: 108 });
  });

  it("does not re-report a milestone already celebrated this run", () => {
    expect(computeMilestoneCrossing(10, 7)).toEqual({ crossed: null, celebratedForCurrentRun: 7 });
    expect(computeMilestoneCrossing(108, 108)).toEqual({ crossed: null, celebratedForCurrentRun: 108 });
  });

  it("resets the marker and re-celebrates from scratch when the streak breaks and rebuilds", () => {
    // Previously celebrated 21, but the streak broke and only just got back to 7
    expect(computeMilestoneCrossing(7, 21)).toEqual({ crossed: 7, celebratedForCurrentRun: 7 });
  });

  it("resets the marker without celebrating if the rebuilt streak hasn't reached a milestone yet", () => {
    expect(computeMilestoneCrossing(3, 21)).toEqual({ crossed: null, celebratedForCurrentRun: 0 });
  });
});

// ─── computeHeatmapGrid ────────────────────────────────────────────────────────

describe("computeHeatmapGrid", () => {
  function countCells(grid: ReturnType<typeof computeHeatmapGrid>) {
    return grid.reduce((sum, col) => sum + col.filter((cell) => cell !== null).length, 0);
  }

  it("returns an empty grid for a zero-length streak", () => {
    expect(computeHeatmapGrid({}, 0)).toEqual([]);
  });

  it("places each cell on its correct weekday row", () => {
    const grid = computeHeatmapGrid({}, 3);
    for (const column of grid) {
      column.forEach((cell, row) => {
        if (cell) expect(cell.weekday).toBe(row);
      });
    }
  });

  it("marks days with a completion as filled and days without as unfilled", () => {
    const history = { [formatDateKey(new Date())]: { "track-a": 1 } };
    const grid = computeHeatmapGrid(history, 2);
    const today = formatDateKey(new Date());
    const flat = grid.flat().filter((cell): cell is NonNullable<typeof cell> => cell !== null);
    const todayCell = flat.find((cell) => cell.dateKey === today);
    const otherCell = flat.find((cell) => cell.dateKey !== today);
    expect(todayCell?.filled).toBe(true);
    expect(otherCell?.filled).toBe(false);
  });

  it("caps the grid at HEATMAP_MAX_DAYS for long streaks", () => {
    const grid = computeHeatmapGrid({}, HEATMAP_MAX_DAYS + 50);
    expect(countCells(grid)).toBe(HEATMAP_MAX_DAYS);
  });

  it("renders exactly streakLength cells when under the cap", () => {
    const grid = computeHeatmapGrid({}, 10);
    expect(countCells(grid)).toBe(10);
  });
});

// ─── computeScheduleStatus ────────────────────────────────────────────────────

describe("computeScheduleStatus", () => {
  it("returns empty array when reminders is empty", () => {
    expect(computeScheduleStatus([], {})).toEqual([]);
  });

  it("excludes disabled reminders", () => {
    const reminder = makeReminder({ enabled: false });
    expect(computeScheduleStatus([reminder], {})).toEqual([]);
  });

  it("marks all items as not done when no completions", () => {
    const reminders = [makeReminder()];
    const result = computeScheduleStatus(reminders, {});
    expect(result[0].done).toBe(false);
  });

  it("marks item as done when completion count exceeds slot index", () => {
    const reminders = [makeReminder()];
    const result = computeScheduleStatus(reminders, { "track-a": 1 });
    expect(result[0].done).toBe(true);
  });

  it("sets current flag on first non-done item only", () => {
    const r1 = makeReminder({ id: "r1", hour: 6, minute: 0 });
    const r2 = makeReminder({ id: "r2", hour: 8, minute: 0 });
    const completions = { "track-a": 1 }; // first slot done
    const result = computeScheduleStatus([r1, r2], completions);
    expect(result[0].current).toBe(false); // done, not current
    expect(result[1].current).toBe(true);  // first non-done
  });

  it("sorts by hour then minute", () => {
    const r1 = makeReminder({ id: "r1", hour: 9, minute: 0 });
    const r2 = makeReminder({ id: "r2", hour: 6, minute: 0 });
    const result = computeScheduleStatus([r1, r2], {});
    expect(result[0].id).toBe("r2");
    expect(result[1].id).toBe("r1");
  });

  it("handles same trackId across multiple reminders using slot index", () => {
    const r1 = makeReminder({ id: "r1", hour: 6, minute: 0, trackId: "track-a" });
    const r2 = makeReminder({ id: "r2", hour: 8, minute: 0, trackId: "track-a" });
    // 1 completion for track-a: slot 0 is done, slot 1 is not
    const result = computeScheduleStatus([r1, r2], { "track-a": 1 });
    expect(result[0].done).toBe(true);
    expect(result[1].done).toBe(false);
  });

  it("formats time as HH:MM with zero-padding", () => {
    const reminder = makeReminder({ hour: 5, minute: 3 });
    const result = computeScheduleStatus([reminder], {});
    expect(result[0].time).toBe("05:03");
  });
});

// ─── computeTodayProgress ─────────────────────────────────────────────────────

describe("computeTodayProgress", () => {
  it("returns { done: 0, total: 0 } when no reminders", () => {
    expect(computeTodayProgress([], {})).toEqual({ done: 0, total: 0 });
  });

  it("excludes disabled reminders from total", () => {
    const reminder = makeReminder({ enabled: false });
    expect(computeTodayProgress([reminder], {})).toEqual({ done: 0, total: 0 });
  });

  it("counts done correctly", () => {
    const reminder = makeReminder();
    expect(computeTodayProgress([reminder], { "track-a": 1 })).toEqual({ done: 1, total: 1 });
  });

  it("caps done per reminder slot, not by raw completion count", () => {
    // 2 enabled reminders for track-a, but 5 completions recorded
    const r1 = makeReminder({ id: "r1", hour: 6, trackId: "track-a" });
    const r2 = makeReminder({ id: "r2", hour: 8, trackId: "track-a" });
    const result = computeTodayProgress([r1, r2], { "track-a": 5 });
    // Only 2 reminders exist for track-a, so max done is 2
    expect(result).toEqual({ done: 2, total: 2 });
  });

  it("handles mixed enabled and disabled reminders", () => {
    const enabled = makeReminder({ id: "r1", trackId: "track-a", enabled: true });
    const disabled = makeReminder({ id: "r2", trackId: "track-b", enabled: false });
    const result = computeTodayProgress([enabled, disabled], { "track-a": 1 });
    expect(result).toEqual({ done: 1, total: 1 });
  });
});

// ─── computeMonthProgress ─────────────────────────────────────────────────────

describe("computeMonthProgress", () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const today = now.getDate();

  it("returns 0 when no completions this month", () => {
    expect(computeMonthProgress({})).toBe(0);
  });

  it("returns 100 when every day up to today has a completion", () => {
    const history: Record<string, Record<string, number>> = {};
    for (let day = 1; day <= today; day++) {
      history[`${year}-${month}-${String(day).padStart(2, "0")}`] = { "track-a": 1 };
    }
    expect(computeMonthProgress(history)).toBe(100);
  });

  it("returns approximately 50 when half the days have completions", () => {
    const history: Record<string, Record<string, number>> = {};
    for (let day = 1; day <= today; day += 2) {
      history[`${year}-${month}-${String(day).padStart(2, "0")}`] = { "track-a": 1 };
    }
    const result = computeMonthProgress(history);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it("ignores days with zero count", () => {
    const day1 = `${year}-${month}-01`;
    expect(computeMonthProgress({ [day1]: { "track-a": 0 } })).toBe(0);
  });

  it("ignores completions from previous months", () => {
    const prevMonth = new Date(year, now.getMonth() - 1, 1);
    const prevKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-01`;
    expect(computeMonthProgress({ [prevKey]: { "track-a": 1 } })).toBe(0);
  });
});
