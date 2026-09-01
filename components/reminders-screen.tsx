/**
 * RemindersScreen
 *
 * Displays the list of user-created daily prayer reminders.
 * From here the user can:
 *   - Toggle a reminder on/off (enables/disables the scheduled notification).
 *   - Delete a reminder (cancels its notification and removes it from the store).
 *   - Tap "+" to navigate to CreateReminderScreen.
 */

import { useI18n } from "@/lib/i18n";
import { GoldGradient } from "@/components/ui/gold-gradient";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useAnalytics } from "@/hooks/use-analytics";
import { useTracks } from "@/hooks/use-tracks";
import {
  cancelReminderNotification,
  requestNotificationPermission,
  scheduleReminderNotification,
} from "@/hooks/use-notifications";
import { useRemindersStore } from "@/store/reminders-store";
import { Reminder } from "@/types/reminder";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";

export function RemindersScreen() {
  const i18n = useI18n();
  const analytics = useAnalytics();
  const { reminders, updateReminder, removeReminder } = useRemindersStore();
  const { getTrackById } = useTracks();
  const [notifStatus, setNotifStatus] = useState<"undetermined" | "denied" | null>(null);

  useEffect(() => {
    async function checkPermission() {
      const { status } = await Notifications.getPermissionsAsync();
      setNotifStatus(status === "granted" ? null : (status as "undetermined" | "denied"));
    }
    checkPermission();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermission();
    });
    return () => sub.remove();
  }, []);

  async function handleAllowNotifications() {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? null : "denied");
  }

  const handleToggle = useCallback(async (reminder: Reminder) => {
    try {
      if (reminder.enabled) {
        // Disable — cancel the scheduled notification.
        await cancelReminderNotification(reminder.notificationId);
        updateReminder({ ...reminder, enabled: false, notificationId: null });
        analytics.capture({ type: 'reminder_toggled', reminderId: reminder.id, enabled: false });
      } else {
        // Enable — reschedule the notification.
        const notificationId = await scheduleReminderNotification(
          reminder,
          getTrackById(reminder.trackId)?.title ?? ""
        );
        updateReminder({ ...reminder, enabled: true, notificationId });
        analytics.capture({ type: 'reminder_toggled', reminderId: reminder.id, enabled: true });
      }
    } catch {
      Alert.alert(i18n.t("errors.notification_update"), i18n.t("errors.notification_update_body"));
    }
  }, [updateReminder, removeReminder, getTrackById, analytics, i18n]);

  const handleDelete = useCallback(async (reminder: Reminder) => {
    try {
      await cancelReminderNotification(reminder.notificationId);
    } catch {
      // Cancel failure is non-fatal — still remove the reminder from the store
      // so the user isn't stuck with a zombie reminder they can't delete.
    }
    analytics.capture({ type: 'reminder_deleted', reminderId: reminder.id });
    removeReminder(reminder.id);
  }, [removeReminder, analytics]);

  const handleEdit = useCallback((reminderId: string) => {
    router.push(`/create-reminder?id=${reminderId}` as any);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t("reminders.title")}</Text>
      </View>

      {/* Notification permission banner */}
      {notifStatus !== null && (
        <View style={styles.permissionBanner}>
          <View style={styles.permissionBannerText}>
            <Text style={styles.permissionBannerTitle}>
              {i18n.t(notifStatus === "undetermined" ? "reminders.notifications_not_enabled" : "reminders.notifications_disabled")}
            </Text>
            <Text style={styles.permissionBannerHint}>
              {i18n.t(notifStatus === "undetermined" ? "reminders.notifications_not_enabled_hint" : "reminders.notifications_disabled_hint")}
            </Text>
          </View>
          {notifStatus === "undetermined" ? (
            <Pressable onPress={handleAllowNotifications} accessibilityRole="button">
              <Text style={styles.permissionBannerAction}>{i18n.t("reminders.allow_notifications")}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button">
              <Text style={styles.permissionBannerAction}>{i18n.t("reminders.open_settings")}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          reminders.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <ReminderRow
            reminder={item}
            trackTitle={getTrackById(item.trackId)?.title ?? item.trackId}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/create-reminder" as any)}
        accessibilityLabel={i18n.t("a11y.add_reminder")}
        accessibilityRole="button"
      >
        <GoldGradient style={styles.fabGradient}>
          <Text style={styles.fabPlus}>+</Text>
        </GoldGradient>
      </Pressable>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

const ReminderRow = React.memo(function ReminderRow({
  reminder,
  trackTitle,
  onToggle,
  onDelete,
  onEdit,
}: {
  reminder: Reminder;
  trackTitle: string;
  onToggle: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
  onEdit: (reminderId: string) => void;
}) {
  const i18n = useI18n();
  const hourStr = String(reminder.hour).padStart(2, "0");
  const minStr = String(reminder.minute).padStart(2, "0");

  return (
    <View style={[styles.row, !reminder.enabled && styles.rowDisabled]}>
      {/* Tappable body: time pill + info */}
      <Pressable style={styles.rowBody} onPress={() => onEdit(reminder.id)}>
        {/* Time pill */}
        <View style={styles.timePill}>
          <Text style={styles.timeText}>
            {hourStr}:{minStr}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          <Text
            style={[styles.rowTitle, !reminder.enabled && styles.rowTitleMuted]}
            numberOfLines={1}
          >
            {reminder.title}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {trackTitle} · {i18n.t("reminders.snooze_label", { count: reminder.snoozeMinutes })}
          </Text>
        </View>
      </Pressable>

      {/* Toggle */}
      <Switch
        value={reminder.enabled}
        onValueChange={() => onToggle(reminder)}
        trackColor={{ false: Colors.border, true: Colors.goldDim }}
        thumbColor={reminder.enabled ? Colors.gold : Colors.muted}
      />

      {/* Delete */}
      <Pressable style={styles.deleteButton} onPress={() => onDelete(reminder)} accessibilityLabel={i18n.t("a11y.delete_reminder")} accessibilityRole="button">
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>
    </View>
  );
});

function EmptyState() {
  const i18n = useI18n();
  return (
    <View style={styles.emptyInner}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>{i18n.t("reminders.empty_title")}</Text>
      <Text style={styles.emptyBody}>{i18n.t("reminders.empty_body")}</Text>
    </View>
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: Colors.cream,
    fontSize: 17,
    fontFamily: Fonts.semiBold,
  },
  // List
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  separator: {
    height: 8,
  },
  // Reminder row
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timePill: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: {
    color: Colors.goldBright,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    color: Colors.cream,
    fontSize: 13.5,
    fontFamily: Fonts.semiBold,
  },
  rowTitleMuted: {
    color: Colors.muted,
  },
  rowMeta: {
    color: Colors.muted,
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139,26,26,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    color: Colors.red,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  // Empty state
  emptyInner: {
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: Colors.cream,
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    textAlign: "center",
  },
  emptyBody: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyHighlight: {
    color: Colors.gold,
    fontFamily: Fonts.bold,
  },
  // Permission banner
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(139,26,26,0.15)",
    borderWidth: 1,
    borderColor: "rgba(139,26,26,0.3)",
  },
  permissionBannerText: {
    flex: 1,
    gap: 2,
  },
  permissionBannerTitle: {
    color: Colors.cream,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  permissionBannerHint: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 17,
  },
  permissionBannerAction: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  // FAB
  fab: {
    position: "absolute",
    right: 24,
    bottom: 36,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPlus: {
    color: Colors.cream,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: Fonts.regular,
  },
});
