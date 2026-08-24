import { TRACKS, Track } from "@/constants/tracks";

const byId = new Map(TRACKS.map((t) => [t.id, t]));

export function useTracks() {
  return { tracks: TRACKS, getTrackById: (id: string): Track | null => byId.get(id) ?? null };
}
