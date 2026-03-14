/**
 * reminders-store
 *
 * Zustand store for user-created prayer reminders.
 * Persisted to AsyncStorage so reminders survive app restarts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Reminder } from "@/types/reminder";

interface RemindersStore {
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
}

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set) => ({
      reminders: [],

      addReminder: (reminder) =>
        set((state) => ({ reminders: [...state.reminders, reminder] })),

      updateReminder: (reminder) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === reminder.id ? reminder : r
          ),
        })),

      removeReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "prayer-reminders",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
