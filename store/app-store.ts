/**
 * app-store
 *
 * Zustand store for global app state.
 * Persisted to AsyncStorage so state survives app restarts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AppState {
  hasSeenOnboarding: boolean;
  _hydrated: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  setHydrated: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      _hydrated: false,
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: "app-state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
