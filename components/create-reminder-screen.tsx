/**
 * CreateReminderScreen
 *
 * Form for creating a new daily prayer reminder.
 *
 * Fields:
 *   1. Title        — free-text label for the reminder
 *   2. Time         — native DateTimePicker (compact on iOS, modal on Android)
 *   3. Chant        — vertical scrollable list of track cards
 *   4. Snooze       — 5 / 10 / 15 minute pill selector
 *
 * On save: schedules a daily repeating notification and persists the
 * reminder in RemindersStore.
 *
 * Track data comes from useTracks() — swap that hook's body to load from
 * Supabase later without any changes here.
 */

import { LotusIcon } from "@/components/icons/lotus-icon";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track } from "@/constants/tracks";
import {
  cancelReminderNotification,
  requestNotificationPermission,
  scheduleReminderNotification,
} from "@/hooks/use-notifications";
import { useTracks } from "@/hooks/use-tracks";
import { useRemindersStore } from "@/store/reminders-store";
import { Reminder } from "@/types/reminder";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface CreateReminderScreenProps {
  onBack: () => void;
  onSave?: () => void;
  reminderId?: string;
}

const SNOOZE_OPTIONS: Array<5 | 10 | 15> = [5, 10, 15];

export function CreateReminderScreen({ onBack, onSave, reminderId }: CreateReminderScreenProps) {
  const addReminder = useRemindersStore((s) => s.addReminder);
  const updateReminder = useRemindersStore((s) => s.updateReminder);
  const reminders = useRemindersStore((s) => s.reminders);
  const tracks = useTracks();

  const existing = reminderId ? reminders.find((r) => r.id === reminderId) : undefined;

  // Form state — pre-populate when editing
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
  const [snoozeMinutes, setSnoozeMinutes] = useState<5 | 10 | 15>(existing?.snoozeMinutes ?? 10);
  const [saving, setSaving] = useState(false);

  function handleTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setTime(selected);
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Thiếu tiêu đề", "Vui lòng nhập tiêu đề nhắc nhở.");
      return;
    }

    setSaving(true);

    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        "Quyền thông báo",
        "Vui lòng cho phép ứng dụng gửi thông báo trong Cài đặt để sử dụng nhắc nhở.",
        [{ text: "OK" }]
      );
      setSaving(false);
      return;
    }

    const reminder: Reminder = {
      id: existing?.id ?? Date.now().toString(),
      title: trimmedTitle,
      trackId: selectedTrack.id,
      hour: time.getHours(),
      minute: time.getMinutes(),
      snoozeMinutes,
      enabled: true,
      notificationId: null,
    };

    if (existing) {
      await cancelReminderNotification(existing.notificationId);
    }

    let notificationId: string | null = null;
    try {
      notificationId = await scheduleReminderNotification(reminder);
    } catch {
      Alert.alert("Lỗi", "Không thể lên lịch thông báo. Vui lòng thử lại.");
      setSaving(false);
      return;
    }

    if (existing) {
      updateReminder({ ...reminder, notificationId });
    } else {
      addReminder({ ...reminder, notificationId });
    }

    setSaving(false);
    if (onSave) { onSave(); } else { router.back(); }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{existing ? "Chỉnh Sửa Nhắc Nhở" : "Nhắc Nhở Mới"}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ── */}
        <Field label="Tiêu Đề">
          <TextInput
            style={styles.textInput}
            placeholder="Vd: Công phu khuya"
            placeholderTextColor={Colors.muted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
            maxLength={60}
          />
        </Field>

        {/* ── Time ──
            iOS compact: renders as a small tappable label in-flow; tapping opens
            an OS overlay — no layout shift, no Done button needed.
            Android default: opens the native time-picker dialog. */}
        <Field label="Thời Gian">
          <View style={styles.timeField}>
            <Text style={styles.timeDailyHint}>Hàng ngày lúc</Text>
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "compact" : "default"}
              onChange={handleTimeChange}
              themeVariant="dark"
            />
          </View>
        </Field>

        {/* ── Chant selector ──
            Vertical list of full-width cards; scales to any number of tracks.
            Track data comes from useTracks() — swap for Supabase in that hook. */}
        <Field label="Kinh / Chú">
          <View style={styles.trackList}>
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                selected={selectedTrack.id === track.id}
                onPress={() => setSelectedTrack(track)}
              />
            ))}
          </View>
        </Field>

        {/* ── Snooze ── */}
        <Field label="Thời Gian Snooze">
          <View style={styles.snoozeRow}>
            {SNOOZE_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[
                  styles.snoozePill,
                  snoozeMinutes === opt && styles.snoozePillActive,
                ]}
                onPress={() => setSnoozeMinutes(opt)}
              >
                <Text
                  style={[
                    styles.snoozePillText,
                    snoozeMinutes === opt && styles.snoozePillTextActive,
                  ]}
                >
                  {opt} phút
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <View style={{ height: 32 }} />

        {/* Save button */}
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <LinearGradient
            colors={[Colors.gold, Colors.red]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveGradient}
          >
            <Text style={styles.saveText}>
              {saving ? "Đang lưu…" : existing ? "Cập Nhật Nhắc Nhở" : "Lưu Nhắc Nhở"}
            </Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TrackRow({
  track,
  selected,
  onPress,
}: {
  track: Track;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.trackRow, selected && styles.trackRowSelected]}
      onPress={onPress}
    >
      {/* Gold left-accent bar when selected */}
      {selected && <View style={styles.trackRowLeftAccent} />}

      <View style={styles.trackRowContent}>
        <LotusIcon
          size={16}
          color={selected ? Colors.gold : track.isPremium ? Colors.goldDim : Colors.muted}
        />
        <View style={styles.trackRowInfo}>
          <Text
            style={[
              styles.trackRowTitle,
              selected && styles.trackRowTitleSelected,
            ]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={styles.trackRowSubtitle} numberOfLines={1}>
            {track.subtitle}
          </Text>
        </View>
        <View style={styles.trackRowRight}>
          {track.durationLabel && (
            <Text style={styles.trackRowDuration}>{track.durationLabel}</Text>
          )}
        </View>
      </View>

      {/* PRO badge */}
      {track.isPremium && (
        <LinearGradient
          colors={[Colors.gold, Colors.red]}
          style={styles.trackRowProBadge}
        >
          <Text style={styles.trackRowProText}>PRO</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: Colors.cream,
    fontSize: 18,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: Colors.cream,
    fontSize: 17,
    fontFamily: Fonts.semiBold,
  },
  headerRight: {
    width: 40,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  // Field wrapper
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: Colors.gold,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  // Text input
  textInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.cream,
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  // Time field — compact DateTimePicker sits inline without layout shifts
  timeField: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeDailyHint: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  // Vertical track list
  trackList: {
    gap: 8,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  trackRowSelected: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(200,135,42,0.08)",
  },
  trackRowLeftAccent: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: Colors.gold,
  },
  trackRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  trackRowInfo: {
    flex: 1,
  },
  trackRowTitle: {
    color: Colors.creamMuted,
    fontSize: 13.5,
    fontFamily: Fonts.semiBold,
  },
  trackRowTitleSelected: {
    color: Colors.cream,
  },
  trackRowSubtitle: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: Fonts.italic,
    marginTop: 2,
  },
  trackRowRight: {
    alignItems: "flex-end",
  },
  trackRowDuration: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  trackRowProBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  trackRowProText: {
    color: Colors.cream,
    fontSize: 8,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  // Snooze pills
  snoozeRow: {
    flexDirection: "row",
    gap: 10,
  },
  snoozePill: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  snoozePillActive: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(200,135,42,0.15)",
  },
  snoozePillText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  snoozePillTextActive: {
    color: Colors.gold,
  },
  // Save button
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: {
    color: Colors.cream,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
});
