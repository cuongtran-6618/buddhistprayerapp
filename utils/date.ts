/**
 * Formats a Date into the app's canonical history key format: "YYYY-MM-DD".
 * Used as the key for DayRecord entries in ChantingHistoryStore.
 */
export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
