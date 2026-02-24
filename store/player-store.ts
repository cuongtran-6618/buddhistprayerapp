import { Track } from '@/constants/tracks';
import { create } from 'zustand';

interface PlayerStore {
  currentTrack: Track | null;
  setTrack: (track: Track) => void;
  clearTrack: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentTrack: null,
  setTrack: (track) => set({ currentTrack: track }),
  clearTrack: () => set({ currentTrack: null }),
}));
