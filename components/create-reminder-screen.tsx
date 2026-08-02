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

import { i18n } from "@/app/lib/i18n";
import { LotusIcon } from "@/components/icons/lotus-icon";
import { GoldGradient } from "@/components/ui/gold-gradient";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track } from "@/constants/tracks";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  cancelReminderNotification,
  requestNotificationPermission,
  scheduleReminderNotification,
} from "@/hooks/use-notifications";
import { useReminderForm } from "@/hooks/use-reminder-form";
import { useTracks } from "@/hooks/use-tracks";
import { useRemindersStore } from "@/store/reminders-store";
import DateTimePicker from "@react-native-community/datetimepicker";
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

const SNOOZE_OPTIONS: (5 | 10 | 15)[] = [5, 10, 15];

export function CreateReminderScreen({ onBack, onSave, reminderId }: CreateReminderScreenProps) {
  const analytics      = useAnalytics();
  const addReminder    = useRemindersStore((s) => s.addReminder);
  const updateReminder = useRemindersStore((s) => s.updateReminder);
  const reminders      = useRemindersStore((s) => s.reminders);
  const { tracks }     = useTracks();

  const existing = reminderId ? reminders.find((r) => r.id === reminderId) : undefined;

  const {
    title, setTitle,
    time, handleTimeChange,
    selectedTrack, setSelectedTrack,
    snoozeMinutes, setSnoozeMinutes,
  } = useReminderForm(tracks, existing);

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert(i18n.t("errors.missing_title"), i18n.t("errors.missing_title_body"));
      return;
    }

    setSaving(true);

    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        i18n.t("errors.notification_permission"),
        i18n.t("errors.notification_permission_body"),
        [{ text: i18n.t("errors.ok") }]
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
      notificationId = await scheduleReminderNotification(reminder, selectedTrack.title);
    } catch {
      Alert.alert(i18n.t("errors.notification_schedule"), i18n.t("errors.notification_schedule_body"));
      setSaving(false);
      return;
    }

    if (existing) {
      updateReminder({ ...reminder, notificationId });
    } else {
      addReminder({ ...reminder, notificationId });
      analytics.capture({ type: 'reminder_created' });
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
        <Text style={styles.headerTitle}>{existing ? i18n.t("create_reminder.title_edit") : i18n.t("create_reminder.title_new")}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ── */}
        <Field label={i18n.t("create_reminder.field_title")}>
          <TextInput
            style={styles.textInput}
            placeholder={i18n.t("create_reminder.placeholder_title")}
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
        <Field label={i18n.t("create_reminder.field_time")}>
          <View style={styles.timeField}>
            <Text style={styles.timeDailyHint}>{i18n.t("create_reminder.daily_hint")}</Text>
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
        <Field label={i18n.t("create_reminder.field_chant")}>
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
        <Field label={i18n.t("create_reminder.field_snooze")}>
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
                  {i18n.t("create_reminder.snooze_minutes", { count: opt })}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <View style={{ height: 32 }} />

        {/* Save button */}
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <GoldGradient style={styles.saveGradient}>
            <Text style={styles.saveText}>
              {saving ? i18n.t("create_reminder.saving") : existing ? i18n.t("create_reminder.update") : i18n.t("create_reminder.save")}
            </Text>
          </GoldGradient>
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
        <GoldGradient style={styles.trackRowProBadge}>
          <Text style={styles.trackRowProText}>PRO</Text>
        </GoldGradient>
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
