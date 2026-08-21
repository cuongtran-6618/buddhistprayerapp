/**
 * Streak milestones chosen for cultural resonance rather than round numbers:
 * 7/49 map to Buddhist mourning/merit cycles, 21 is a common habit-formed
 * threshold, and 108 is the mala bead count — the most recognizable number
 * in the practice. After 108 the cycle repeats every 108 days.
 */
export const BASE_MILESTONES = [7, 21, 49, 108] as const;
export const MILESTONE_REPEAT_INTERVAL = 108;

/** Max days rendered in a milestone share card's heatmap grid, bounding capture cost for long streaks */
export const HEATMAP_MAX_DAYS = 112;

/** Smallest milestone strictly greater than `after` (0 for "no milestone celebrated yet") */
export function getNextMilestone(after: number): number {
  const base = BASE_MILESTONES.find((m) => m > after);
  if (base !== undefined) return base;
  return after + MILESTONE_REPEAT_INTERVAL;
}
