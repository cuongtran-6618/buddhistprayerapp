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
  language: 'vi' | 'en';
  _hydrated: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  setLanguage: (lang: 'vi' | 'en') => void;
  setHydrated: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      language: 'vi',
      _hydrated: false,
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setLanguage: (lang) => set({ language: lang }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: "app-state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding, language: state.language }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
