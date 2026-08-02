import { useMemo } from "react";
import { TRACKS, Track } from "@/constants/tracks";

export interface TrackRegistry {
  tracks: Track[];
  getTrackById: (id: string) => Track | null;
}

export function useTracks(): TrackRegistry {
  return useMemo(() => {
    const byId = new Map(TRACKS.map((t) => [t.id, t]));
    return {
      tracks: TRACKS,
      getTrackById: (id: string) => byId.get(id) ?? null,
    };
  }, []);
}
