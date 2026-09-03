import { TRACKS, Track } from "@/constants/tracks";

const byId = new Map(TRACKS.map((track) => [track.id, track]));

export function useTracks() {
  return { tracks: TRACKS, getTrackById: (id: string): Track | null => byId.get(id) ?? null };
}
