import { BellIcon } from "@/components/icons/bell-icon";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track, TRACKS } from "@/constants/tracks";
import {
  ScheduleItemData,
  computeMonthProgress,
  computeScheduleStatus,
  computeStreak,
  computeTodayProgress,
  getTodayKey,
  useChantingHistoryStore,
} from "@/store/chanting-history-store";
import { useRemindersStore } from "@/store/reminders-store";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface HomeScreenProps {
  onChantSelect: (track: Track) => void;
  onRemindersPress: () => void;
}


function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { vi: "Khuya tĩnh lặng", en: "Peaceful night" };
  if (h < 12) return { vi: "Buổi sáng an lành", en: "Good morning" };
  if (h < 17) return { vi: "Buổi trưa bình an", en: "Good afternoon" };
  return { vi: "Buổi tối thanh tịnh", en: "Good evening" };
}

function GlowView({ style, children }: { style?: object; children: React.ReactNode }) {
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[style, { opacity: glowAnim }]}>{children}</Animated.View>;
}

export function HomeScreen({ onChantSelect, onRemindersPress }: HomeScreenProps) {
  const g = getGreeting();
  const reminders = useRemindersStore((s) => s.reminders);
  const history = useChantingHistoryStore((s) => s.history);

  const todayCompletions = history[getTodayKey()] ?? {};
  const scheduleItems = computeScheduleStatus(reminders, todayCompletions);
  const { done, total } = computeTodayProgress(reminders, todayCompletions);
  const streak = computeStreak(history);
  const monthPct = computeMonthProgress(history);

  return (
    <View style={styles.container}>
      {/* Header background gradient */}
      <View style={styles.headerGradientOverlay} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingEn}>{g.en}</Text>
            <Text style={styles.greetingVi}>{g.vi}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={onRemindersPress}>
              <BellIcon size={18} />
            </Pressable>
            <LinearGradient
              colors={[Colors.gold, Colors.red]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarButton}
            >
              <Text style={styles.avatarEmoji}>🙏</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Streak card */}
        <GlowView style={styles.streakCard}>
          <LinearGradient
            colors={["rgba(200,135,42,0.25)", "rgba(139,26,26,0.2)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakGradient}
          >
            <Text style={styles.streakFire}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>
                {streak} ngày <Text style={styles.streakHighlight}>liên tiếp</Text>
              </Text>
              <Text style={styles.streakSub}>{streak}-day streak • {done} buổi hôm nay</Text>
            </View>
            <View style={styles.streakRight}>
              <Text style={styles.streakMonth}>THÁNG NÀY</Text>
              <Text style={styles.streakPercent}>{monthPct}%</Text>
            </View>
          </LinearGradient>
        </GlowView>

        {/* Today's schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thời Khóa Hôm Nay</Text>
            <Pressable onPress={onRemindersPress}>
              <Text style={styles.sectionAction}>Chỉnh sửa</Text>
            </Pressable>
          </View>
          {scheduleItems.length === 0 ? (
            <Pressable style={styles.emptySchedule} onPress={onRemindersPress}>
              <Text style={styles.emptyScheduleText}>Chưa có lịch tụng kinh</Text>
              <Text style={styles.emptyScheduleHint}>Nhấn để thêm nhắc nhở →</Text>
            </Pressable>
          ) : (
            <View style={styles.scheduleList}>
              {scheduleItems.map((item) => {
                const track = TRACKS.find((t) => t.id === item.trackId);
                return (
                  <ScheduleItem
                    key={item.id}
                    item={item}
                    onPress={item.current && track ? () => onChantSelect(track) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

function ScheduleItem({ item, onPress }: { item: ScheduleItemData; onPress?: () => void }) {
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (item.current) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [item.current]);

  if (item.current) {
    return (
      <Pressable onPress={onPress}>
        <Animated.View style={{ opacity: glowAnim }}>
          <LinearGradient
            colors={["rgba(200,135,42,0.18)", "rgba(139,26,26,0.12)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.scheduleItem, styles.scheduleItemCurrent]}
          >
            <ScheduleItemContent item={item} />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={styles.scheduleItem}>
      <ScheduleItemContent item={item} />
    </View>
  );
}

function ScheduleItemContent({ item }: { item: ScheduleItemData }) {
  const trackTitle = TRACKS.find((t) => t.id === item.trackId)?.title ?? item.trackId;
  return (
    <>
      <Text style={[styles.scheduleTime, item.current && styles.scheduleTimeCurrent]}>
        {item.time}
      </Text>
      <View style={[styles.scheduleDivider, item.current && styles.scheduleDividerCurrent]} />
      <View style={styles.scheduleText}>
        <Text
          style={[
            styles.scheduleLabel,
            item.done && styles.scheduleLabelDone,
            item.current && styles.scheduleLabelCurrent,
          ]}
        >
          {item.label}
        </Text>
        <Text
          style={[
            styles.scheduleChant,
            item.current && styles.scheduleChantCurrent,
          ]}
        >
          {trackTitle}
        </Text>
      </View>
      <View>
        {item.done ? (
          <View style={styles.doneCircle}>
            <Text style={styles.doneCheck}>✓</Text>
          </View>
        ) : item.current ? (
          <LinearGradient
            colors={[Colors.gold, Colors.red]}
            style={styles.playButton}
          >
            <Text style={styles.playIcon}>▶</Text>
          </LinearGradient>
        ) : (
          <View style={styles.pendingCircle} />
        )}
      </View>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(200,135,42,0.06)",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  greetingEn: {
    color: Colors.gold,
    fontSize: 11.5,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  greetingVi: {
    color: Colors.cream,
    fontSize: 22,
    fontFamily: Fonts.bold,
    lineHeight: 27,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 16,
  },
  // Streak card
  streakCard: {
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(200,135,42,0.25)",
  },
  streakGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 20,
  },
  streakFire: {
    fontSize: 42,
    lineHeight: 48,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    color: Colors.cream,
    fontSize: 24,
    fontFamily: Fonts.bold,
    lineHeight: 28,
  },
  streakHighlight: {
    color: Colors.gold,
  },
  streakSub: {
    color: Colors.muted,
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  streakRight: {
    alignItems: "flex-end",
  },
  streakMonth: {
    color: Colors.gold,
    fontSize: 11,
    fontFamily: Fonts.regular,
    letterSpacing: 1,
  },
  streakPercent: {
    color: Colors.cream,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  // Sections
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.cream,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  sectionAction: {
    color: Colors.gold,
    fontSize: 12.5,
    fontFamily: Fonts.regular,
  },
  // Empty schedule state
  emptySchedule: {
    padding: 24,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 6,
  },
  emptyScheduleText: {
    color: Colors.creamMuted,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  emptyScheduleHint: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  // Schedule
  scheduleList: {
    gap: 8,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleItemCurrent: {
    borderColor: "rgba(200,135,42,0.35)",
  },
  scheduleTime: {
    color: Colors.muted,
    fontSize: 12.5,
    fontFamily: Fonts.semiBold,
    minWidth: 44,
    textAlign: "center",
  },
  scheduleTimeCurrent: {
    color: Colors.goldBright,
  },
  scheduleDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  scheduleDividerCurrent: {
    backgroundColor: "rgba(200,135,42,0.3)",
  },
  scheduleText: {
    flex: 1,
  },
  scheduleLabel: {
    color: Colors.creamMuted,
    fontSize: 13.5,
    fontFamily: Fonts.regular,
  },
  scheduleLabelDone: {
    color: Colors.muted,
    textDecorationLine: "line-through",
  },
  scheduleLabelCurrent: {
    color: Colors.cream,
    fontFamily: Fonts.semiBold,
  },
  scheduleChant: {
    color: Colors.muted,
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  scheduleChantCurrent: {
    color: Colors.gold,
  },
  doneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(100,180,100,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  doneCheck: {
    color: Colors.cream,
    fontSize: 12,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: Colors.cream,
    fontSize: 13,
  },
  pendingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 60,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.gold,
    fontFamily: Fonts.semiBold,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
});
