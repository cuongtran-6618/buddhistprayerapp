/**
 * useTracks
 *
 * Returns the list of available chant tracks.
 *
 * TODAY: returns the static TRACKS array from constants/tracks.ts synchronously.
 *
 * FUTURE (Supabase): swap the body to a query hook, e.g.:
 *   const [tracks, setTracks] = useState<Track[]>([]);
 *   useEffect(() => { supabase.from('tracks').select('*').then(...) }, []);
 *   return tracks;
 *
 * No changes in any consuming component are needed — only this file changes.
 */
import { TRACKS, Track } from "@/constants/tracks";

export function useTracks(): Track[] {
  return TRACKS;
}
