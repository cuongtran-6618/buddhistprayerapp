import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePulsingRings } from "@/hooks/use-pulsing-rings";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { i18n } from "../app/lib/i18n";

interface WelcomeScreenProps {
  onStart: () => void;
}

const RING_SIZES = [220, 180, 145];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const analytics = useAnalytics();

  const ringAnims = usePulsingRings(RING_SIZES);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <View style={styles.ringContainer}>
          {ringAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ring,
                {
                  width: RING_SIZES[i],
                  height: RING_SIZES[i],
                  borderColor: `rgba(200,135,42,${0.06 + i * 0.07})`,
                  transform: [{ scale: anim }],
                },
              ]}
            />
          ))}
          <View style={styles.centerCircle}>
            <Text style={styles.icon}>🪷</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.eyebrow}>{i18n.t("welcome.eyebrow")}</Text>
          <Text style={styles.title}>{i18n.t("welcome.title")}</Text>
          <Text style={styles.body}>{i18n.t("welcome.body")}</Text>
        </View>
      </Animated.View>

      <View style={styles.bottom}>
        <Pressable
          onPress={() => {
            analytics.capture({ type: "onboarding_completed" });
            onStart();
          }}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={[Colors.gold, Colors.red]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{i18n.t("welcome.cta")}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 48,
  },
  ringContainer: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  centerCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(200,135,42,0.08)",
    borderWidth: 1,
    borderColor: "rgba(200,135,42,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 52,
  },
  textBlock: {
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    color: Colors.goldBright,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: Fonts.medium,
  },
  title: {
    color: Colors.cream,
    fontSize: 34,
    fontFamily: Fonts.bold,
    lineHeight: 44,
    textAlign: "center",
  },
  body: {
    color: Colors.creamMuted,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Fonts.regular,
    textAlign: "center",
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  ctaText: {
    color: Colors.cream,
    fontSize: 16,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
});
