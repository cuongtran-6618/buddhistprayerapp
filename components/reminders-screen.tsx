/**
 * RemindersScreen
 *
 * Displays the list of user-created daily prayer reminders.
 * From here the user can:
 *   - Toggle a reminder on/off (enables/disables the scheduled notification).
 *   - Delete a reminder (cancels its notification and removes it from the store).
 *   - Tap "+" to navigate to CreateReminderScreen.
 */

import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { TRACKS } from "@/constants/tracks";
import {
  cancelReminderNotification,
  scheduleReminderNotification,
} from "@/hooks/use-notifications";
import { useRemindersStore } from "@/store/reminders-store";
import { Reminder } from "@/types/reminder";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export function RemindersScreen() {
  const { reminders, updateReminder, removeReminder } = useRemindersStore();

  async function handleToggle(reminder: Reminder) {
    if (reminder.enabled) {
      // Disable — cancel the scheduled notification.
      await cancelReminderNotification(reminder.notificationId);
      updateReminder({ ...reminder, enabled: false, notificationId: null });
    } else {
      // Enable — reschedule the notification.
      const notificationId = await scheduleReminderNotification(reminder);
      updateReminder({ ...reminder, enabled: true, notificationId });
    }
  }

  async function handleDelete(reminder: Reminder) {
    await cancelReminderNotification(reminder.notificationId);
    removeReminder(reminder.id);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhắc Nhở</Text>
      </View>

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
            onToggle={() => handleToggle(item)}
            onDelete={() => handleDelete(item)}
            onEdit={() => router.push(`/create-reminder?id=${item.id}` as any)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/create-reminder" as any)}
      >
        <LinearGradient
          colors={[Colors.gold, Colors.red]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabPlus}>+</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ReminderRow({
  reminder,
  onToggle,
  onDelete,
  onEdit,
}: {
  reminder: Reminder;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const track = TRACKS.find((t) => t.id === reminder.trackId);
  const hourStr = String(reminder.hour).padStart(2, "0");
  const minStr = String(reminder.minute).padStart(2, "0");

  return (
    <View style={[styles.row, !reminder.enabled && styles.rowDisabled]}>
      {/* Tappable body: time pill + info */}
      <Pressable style={styles.rowBody} onPress={onEdit}>
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
            {track?.title ?? reminder.trackId} · Snooze {reminder.snoozeMinutes} phút
          </Text>
        </View>
      </Pressable>

      {/* Toggle */}
      <Switch
        value={reminder.enabled}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.goldDim }}
        thumbColor={reminder.enabled ? Colors.gold : Colors.muted}
      />

      {/* Delete */}
      <Pressable style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyInner}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>Chưa có nhắc nhở</Text>
      <Text style={styles.emptyBody}>
        Nhấn <Text style={styles.emptyHighlight}>+</Text> để tạo nhắc nhở cầu nguyện hàng ngày.
      </Text>
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
    borderRadius: 8,
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
  // FAB
  fab: {
    position: "absolute",
    right: 24,
    bottom: 36,
    borderRadius: 20,
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
