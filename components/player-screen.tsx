import { LotusIcon } from "@/components/icons/lotus-icon";
import { GoldGradient } from "@/components/ui/gold-gradient";
import { i18n } from "@/app/lib/i18n";
import { SCRIPT_LINE_HEIGHT } from "@/constants/animation";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track } from "@/constants/tracks";
import { AudioPlayer, useAudioPlayer } from "@/hooks/use-audio-player";
import { PlayerAnimations, usePlayerAnimations } from "@/hooks/use-player-animations";
import { UseSeekGestureResult, useSeekGesture } from "@/hooks/use-seek-gesture";
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

interface PlayerScreenProps {
  onBack: () => void;
  onComplete?: () => void;
  track: Track;
}

export function PlayerScreen({ onBack, onComplete, track }: PlayerScreenProps) {
  const player = useAudioPlayer(track, onComplete);
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
      <View style={styles.atmosphereTop}    pointerEvents="none" />
      <View style={styles.atmosphereBottom} pointerEvents="none" />

      <Header track={track} onBack={onBack} />
      <MandalaSection  track={track} player={player} anims={anims} />
      <TrackInfo       track={track} />
      <ChantScrollSection track={track} player={player} anims={anims} scrollRef={scrollRef} />
      <ProgressSection seek={seek} player={player} />
      <ControlsSection player={player} />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header({ track, onBack }: { track: Track; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.headerButton}>
        <Text style={styles.headerButtonText}>←</Text>
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerLabel}>{i18n.t("player.now_chanting")}</Text>
        <Text style={styles.headerSub}>{track.subtitle}</Text>
      </View>
      <Pressable style={styles.headerButton}>
        <Text style={styles.headerButtonText}>⋯</Text>
      </Pressable>
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
  anims: PlayerAnimations;
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
  anims: PlayerAnimations;
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
  seek: UseSeekGestureResult;
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

function ControlsSection({ player }: { player: AudioPlayer }) {
  return (
    <View style={styles.controls}>
      <Pressable style={styles.controlBtnSm}>
        <Text style={styles.controlBtnEmoji}>🔀</Text>
      </Pressable>
      <Pressable
        style={styles.controlBtnMd}
        onPress={() => player.seekToLine(player.activeLineIndex - 1)}
      >
        <Text style={styles.controlBtnEmoji}>⏮</Text>
      </Pressable>

      <Pressable onPress={player.togglePlay} style={styles.playBtnWrapper}>
        <GoldGradient style={[styles.playBtn, player.playing && styles.playBtnActive]}>
          <Text style={styles.playBtnIcon}>{player.playing ? "⏸" : "▶"}</Text>
        </GoldGradient>
      </Pressable>

      <Pressable
        style={styles.controlBtnMd}
        onPress={() => player.seekToLine(player.activeLineIndex + 1)}
      >
        <Text style={styles.controlBtnEmoji}>⏭</Text>
      </Pressable>
      <Pressable style={styles.controlBtnSm}>
        <Text style={styles.controlBtnEmoji}>🔁</Text>
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
  atmosphereTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "rgba(139,26,26,0.12)",
  },
  atmosphereBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "rgba(200,135,42,0.04)",
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
    borderRadius: 12,
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
  controlBtnSm: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnMd: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnEmoji: {
    fontSize: 20,
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
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    shadowOpacity: 0.5,
  },
  playBtnIcon: {
    fontSize: 26,
  },
});
