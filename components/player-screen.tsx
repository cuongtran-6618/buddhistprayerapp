import { LotusIcon } from "@/components/icons/lotus-icon";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track } from "@/constants/tracks";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PlayerScreenProps {
  onBack: () => void;
  track: Track;
}

export function PlayerScreen({ onBack, track }: PlayerScreenProps) {
  const player = useAudioPlayer(track);
  const scrollRef = useRef<ScrollView>(null);

  // Derived time display
  const elapsedMs  = Math.floor(player.progress * player.durationMs);
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const totalMin   = Math.floor(player.durationMs / 60000);
  const totalSec   = Math.floor((player.durationMs % 60000) / 1000);

  // Mandala / breathing animations
  const breatheAnim    = useRef(new Animated.Value(1)).current;
  const outerRotate    = useRef(new Animated.Value(0)).current;
  const middleRotate   = useRef(new Animated.Value(0)).current;
  const activeGlowAnim = useRef(new Animated.Value(0.6)).current;

  const outerRotateAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const middleRotateAnim = useRef<Animated.CompositeAnimation | null>(null);
  const breatheLoopAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopAnim     = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (player.playing) {
      breatheLoopAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
        ])
      );
      breatheLoopAnim.current.start();

      outerRotateAnim.current = Animated.loop(
        Animated.timing(outerRotate, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })
      );
      outerRotateAnim.current.start();

      middleRotateAnim.current = Animated.loop(
        Animated.timing(middleRotate, { toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: true })
      );
      middleRotateAnim.current.start();

      glowLoopAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(activeGlowAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
          Animated.timing(activeGlowAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        ])
      );
      glowLoopAnim.current.start();
    } else {
      breatheLoopAnim.current?.stop();
      outerRotateAnim.current?.stop();
      middleRotateAnim.current?.stop();
      glowLoopAnim.current?.stop();
      Animated.timing(breatheAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [player.playing]);

  // Auto-scroll to active line
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: player.activeLineIndex * 44, animated: true });
  }, [player.activeLineIndex]);

  const outerRotateDeg  = outerRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const middleRotateDeg = middleRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });

  return (
    <View style={styles.container}>
      {/* Background atmosphere */}
      <View style={styles.atmosphereTop} pointerEvents="none" />
      <View style={styles.atmosphereBottom} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>Đang Tụng</Text>
          <Text style={styles.headerSub}>{track.subtitle}</Text>
        </View>
        <Pressable style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⋯</Text>
        </Pressable>
      </View>

      {/* Mandala album art */}
      <View style={styles.mandalaContainer}>
        <Animated.View style={[styles.outerRing, { transform: [{ rotate: outerRotateDeg }] }]}>
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

        <Animated.View style={[styles.middleRing, { transform: [{ rotate: middleRotateDeg }] }]} />

        <Animated.View style={[styles.centerLotus, { transform: [{ scale: breatheAnim }] }]}>
          <LotusIcon size={40} color={player.playing ? Colors.goldBright : Colors.gold} />
        </Animated.View>
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackSub}>{track.subtitle}</Text>
      </View>

      {/* Scrolling script lines */}
      <View style={styles.chantContainer}>
        <LinearGradient colors={[Colors.bg, "transparent"]} style={styles.fadeTop} pointerEvents="none" />
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
                    opacity: isActive && player.playing ? activeGlowAnim : opacity,
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

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[Colors.red, Colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${player.progress * 100}%` }]}
          />
        </View>
        <View style={styles.progressTimes}>
          <Text style={styles.progressTime}>
            {elapsedMin}:{String(elapsedSec).padStart(2, "0")}
          </Text>
          <Text style={styles.progressTime}>
            {totalMin}:{String(totalSec).padStart(2, "0")}
          </Text>
        </View>
      </View>

      {/* Controls */}
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
          <LinearGradient
            colors={[Colors.gold, Colors.red]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.playBtn, player.playing && styles.playBtnActive]}
          >
            <Text style={styles.playBtnIcon}>{player.playing ? "⏸" : "▶"}</Text>
          </LinearGradient>
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
    </View>
  );
}

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
    height: 44,
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
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTime: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: Fonts.regular,
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
