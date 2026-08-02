/**
 * useReminderForm
 *
 * Manages all form state for creating or editing a daily prayer reminder.
 * Pre-populates fields from `existing` when editing; uses sensible defaults
 * for new reminders.
 *
 * Keeping form state here keeps CreateReminderScreen focused solely on
 * layout, validation, and submission — not on state initialisation logic.
 */

import { Track } from "@/constants/tracks";
import { Reminder } from "@/types/reminder";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";

export interface ReminderFormState {
  title: string;
  setTitle: (v: string) => void;
  time: Date;
  handleTimeChange: (_event: DateTimePickerEvent, selected?: Date) => void;
  selectedTrack: Track;
  setSelectedTrack: (track: Track) => void;
  snoozeMinutes: 5 | 10 | 15;
  setSnoozeMinutes: (v: 5 | 10 | 15) => void;
}

export function useReminderForm(
  tracks: Track[],
  existing?: Reminder
): ReminderFormState {
  const [title, setTitle] = useState(existing?.title ?? "");

  const [time, setTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(existing?.hour ?? d.getHours());
    d.setMinutes(existing?.minute ?? d.getMinutes());
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  });

  const [selectedTrack, setSelectedTrack] = useState<Track>(
    tracks.find((t) => t.id === existing?.trackId) ?? tracks[0]
  );

  const [snoozeMinutes, setSnoozeMinutes] = useState<5 | 10 | 15>(
    existing?.snoozeMinutes ?? 10
  );

  function handleTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setTime(selected);
  }

  return {
    title,
    setTitle,
    time,
    handleTimeChange,
    selectedTrack,
    setSelectedTrack,
    snoozeMinutes,
    setSnoozeMinutes,
  };
}
