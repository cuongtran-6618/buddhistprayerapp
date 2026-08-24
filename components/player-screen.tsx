import { LotusIcon } from "@/components/icons/lotus-icon";
import { MilestoneShareModal } from "@/components/milestone-share-modal";
import { GoldGradient } from "@/components/ui/gold-gradient";
import { useI18n } from "@/lib/i18n";
import { SCRIPT_LINE_HEIGHT } from "@/constants/animation";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track } from "@/constants/tracks";
import { AudioPlayer, useAudioPlayer } from "@/hooks/use-audio-player";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePlayerAnimations } from "@/hooks/use-player-animations";
import { useSeekGesture } from "@/hooks/use-seek-gesture";
import { useChantingHistoryStore } from "@/store/chanting-history-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PlayerScreenProps {
  onBack: () => void;
  onComplete?: () => void;
  track: Track;
}

export function PlayerScreen({ onBack, onComplete, track }: PlayerScreenProps) {
  const checkMilestone = useChantingHistoryStore((s) => s.checkMilestone);
  const analytics = useAnalytics();
  const [celebratedMilestone, setCelebratedMilestone] = useState<number | null>(null);

  const completedRef = useRef(false);
  const progressRef = useRef(0);
  const durationRef = useRef(0);

  const handleComplete = useCallback(() => {
    completedRef.current = true;
    analytics.capture({ type: 'chant_completed', trackId: track.id, durationMs: durationRef.current });
    const crossed = checkMilestone();
    if (crossed) setCelebratedMilestone(crossed);
    onComplete?.();
  }, [onComplete, checkMilestone, analytics, track.id]);

  useEffect(() => {
    completedRef.current = false;
    analytics.capture({ type: 'chant_started', trackId: track.id });
    return () => {
      if (!completedRef.current) {
        analytics.capture({
          type: 'chant_abandoned',
          trackId: track.id,
          progressPercent: Math.round(progressRef.current * 100),
        });
      }
    };
  }, [analytics, track.id]);

  const player = useAudioPlayer(track, handleComplete);
  progressRef.current = player.progress;
  durationRef.current = player.durationMs;

  const anims  = usePlayerAnimations(player.playing);
  const scrollRef = useRef<ScrollView>(null);

  const seek = useSeekGesture({
    durationMs:      player.durationMs,
    currentProgress: player.progress,
    onSeek:          player.seekTo,
  });

  // Auto-scroll lyrics to the active line
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: player.activeLineIndex * SCRIPT_LINE_HEIGHT, animated: true });
  }, [player.activeLineIndex]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(139,26,26,0.55)", "rgba(80,25,5,0.25)", "rgba(200,135,42,0.06)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.atmosphere}
        pointerEvents="none"
      />

      <Header track={track} onBack={onBack} />
      <MandalaSection  track={track} player={player} anims={anims} />
      <TrackInfo       track={track} />
      <ChantScrollSection track={track} player={player} anims={anims} scrollRef={scrollRef} />
      <ProgressSection seek={seek} player={player} />
      <ControlsSection player={player} trackId={track.id} />

      <MilestoneShareModal
        streak={celebratedMilestone}
        onClose={() => setCelebratedMilestone(null)}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ track, onBack }: { track: Track; onBack: () => void }) {
  const i18n = useI18n();
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.headerButton}>
        <Text style={styles.headerButtonText}>←</Text>
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerLabel}>{i18n.t("player.now_chanting")}</Text>
        <Text style={styles.headerSub}>{track.subtitle}</Text>
      </View>
      <View style={styles.headerButton} />
    </View>
  );
}

function MandalaSection({
  track,
  player,
  anims,
}: {
  track: Track;
  player: AudioPlayer;
  anims: ReturnType<typeof usePlayerAnimations>;
}) {
  return (
    <View style={styles.mandalaContainer}>
      <Animated.View style={[styles.outerRing, { transform: [{ rotate: anims.outerRotateDeg }] }]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.mandalaTick,
              { transform: [{ rotate: `${i * 30}deg` }, { translateY: -75 }] },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[styles.middleRing, { transform: [{ rotate: anims.middleRotateDeg }] }]} />

      <Animated.View style={[styles.centerLotus, { transform: [{ scale: anims.breatheAnim }] }]}>
        <LotusIcon size={40} color={player.playing ? Colors.goldBright : Colors.gold} />
      </Animated.View>
    </View>
  );
}

function TrackInfo({ track }: { track: Track }) {
  return (
    <View style={styles.trackInfo}>
      <Text style={styles.trackTitle}>{track.title}</Text>
      <Text style={styles.trackSub}>{track.subtitle}</Text>
    </View>
  );
}

function ChantScrollSection({
  track,
  player,
  anims,
  scrollRef,
}: {
  track: Track;
  player: AudioPlayer;
  anims: ReturnType<typeof usePlayerAnimations>;
  scrollRef: React.RefObject<ScrollView>;
}) {
  return (
    <View style={styles.chantContainer}>
      <LinearGradient colors={[Colors.bg, "transparent"]} style={styles.fadeTop}    pointerEvents="none" />
      <LinearGradient colors={["transparent", Colors.bg]} style={styles.fadeBottom} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={styles.chantScroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {track.script.map((line, i) => {
          const isActive = i === player.activeLineIndex;
          const isPast   = i < player.activeLineIndex;
          const dist     = Math.abs(i - player.activeLineIndex);
          const opacity  = dist > 3 ? 0.15 : dist > 2 ? 0.3 : dist > 1 ? 0.5 : dist > 0 ? 0.7 : 1;
          const scale    = isActive ? 1.04 : Math.max(0.97, 1 - dist * 0.015);

          return (
            <Animated.View
              key={i}
              style={[
                styles.chantLine,
                {
                  opacity:   isActive && player.playing ? anims.activeGlowAnim : opacity,
                  transform: [{ scale }],
                },
              ]}
            >
              <Text
                style={[
                  styles.chantText,
                  isActive && styles.chantTextActive,
                  isPast && !isActive && styles.chantTextPast,
                ]}
              >
                {line.text}
              </Text>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ProgressSection({
  seek,
  player,
}: {
  seek: ReturnType<typeof useSeekGesture>;
  player: AudioPlayer;
}) {
  const displayMs  = Math.floor(seek.displayProgress * player.durationMs);
  const displayMin = Math.floor(displayMs / 60000);
  const displaySec = Math.floor((displayMs % 60000) / 1000);
  const totalMin   = Math.floor(player.durationMs / 60000);
  const totalSec   = Math.floor((player.durationMs % 60000) / 1000);

  return (
    <View style={styles.progressSection}>
      {/*
        seekArea is the full-width gesture target (28 px tall so it's easy
        to tap). overflow: "visible" lets the thumb render outside the 3 px
        track. panHandlers attach the PanResponder; onLayout captures the
        rendered width so the hook can convert touch X → 0–1 progress.
      */}
      <View
        style={styles.seekArea}
        onLayout={seek.handleLayout}
        {...seek.panHandlers}
      >
        {/* 3 px track — clips gradient fill to rounded corners */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[Colors.red, Colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${seek.displayProgress * 100}%` }]}
          />
        </View>

        {/* Scrubber thumb — grows slightly while dragging */}
        <View
          style={[
            styles.scrubberThumb,
            seek.isDragging && styles.scrubberThumbDragging,
            {
              left: `${seek.displayProgress * 100}%` as `${number}%`,
              transform: [{ translateX: seek.isDragging ? -7 : -6 }],
            },
          ]}
        />
      </View>

      {/* Time labels — elapsed label tracks drag position while scrubbing */}
      <View style={styles.progressTimes}>
        <Text style={[styles.progressTime, seek.isDragging && styles.progressTimeActive]}>
          {displayMin}:{String(displaySec).padStart(2, "0")}
        </Text>
        <Text style={styles.progressTime}>
          {totalMin}:{String(totalSec).padStart(2, "0")}
        </Text>
      </View>
    </View>
  );
}

function ControlsSection({ player, trackId }: { player: AudioPlayer; trackId: string }) {
  const analytics = useAnalytics();

  return (
    <View style={styles.controls}>
      <Pressable
        style={styles.controlBtnMd}
        onPress={() => {
          player.seekToLine(player.activeLineIndex - 1);
          analytics.capture({ type: 'chant_seeked', trackId, direction: 'backward' });
        }}
      >
        <Ionicons name="play-skip-back" size={22} color={Colors.gold} />
      </Pressable>

      <Pressable onPress={player.togglePlay} style={styles.playBtnWrapper}>
        <GoldGradient style={[styles.playBtn, player.playing && styles.playBtnActive]}>
          <Ionicons name={player.playing ? "pause" : "play"} size={28} color={Colors.cream} />
        </GoldGradient>
      </Pressable>

      <Pressable
        style={styles.controlBtnMd}
        onPress={() => {
          player.seekToLine(player.activeLineIndex + 1);
          analytics.capture({ type: 'chant_seeked', trackId, direction: 'forward' });
        }}
      >
        <Ionicons name="play-skip-forward" size={22} color={Colors.gold} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: 50,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: {
    color: Colors.cream,
    fontSize: 18,
    fontFamily: Fonts.regular,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerLabel: {
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontFamily: Fonts.regular,
  },
  headerSub: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  mandalaContainer: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "rgba(200,135,42,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mandalaTick: {
    position: "absolute",
    width: 3,
    height: 10,
    backgroundColor: "rgba(200,135,42,0.3)",
    borderRadius: 2,
    top: "50%",
    left: "50%",
  },
  middleRing: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: "rgba(200,135,42,0.12)",
    backgroundColor: "rgba(200,135,42,0.02)",
  },
  centerLotus: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(200,135,42,0.1)",
    borderWidth: 1,
    borderColor: "rgba(200,135,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 4,
  },
  trackTitle: {
    color: Colors.cream,
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  trackSub: {
    color: Colors.muted,
    fontSize: 12.5,
    fontFamily: Fonts.italic,
  },
  chantContainer: {
    flex: 1,
    overflow: "hidden",
    marginVertical: 8,
    position: "relative",
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 5,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 5,
  },
  chantScroll: {
    flex: 1,
    paddingVertical: 8,
  },
  chantLine: {
    paddingVertical: 7,
    paddingHorizontal: 28,
    alignItems: "center",
    height: SCRIPT_LINE_HEIGHT,
    justifyContent: "center",
  },
  chantText: {
    color: Colors.creamMuted,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 21,
    textAlign: "center",
  },
  chantTextActive: {
    color: Colors.goldBright,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  chantTextPast: {
    color: Colors.muted,
  },
  progressSection: {
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  seekArea: {
    height: 28,
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  scrubberThumb: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gold,
    top: 8,
  },
  scrubberThumbDragging: {
    width: 14,
    height: 14,
    borderRadius: 7,
    top: 7,
  },
  progressTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  progressTime: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  progressTimeActive: {
    color: Colors.goldBright,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 4,
    paddingBottom: 36,
  },
  controlBtnMd: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnWrapper: {
    borderRadius: 34,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    shadowOpacity: 0.5,
  },
});
