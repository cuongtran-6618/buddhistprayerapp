import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { i18n } from '../app/lib/i18n';

interface OnboardingScreenProps {
  onNext: () => void;
}

const slides = [
  {
    icon: "🪷",
    title: i18n.t("onboarding.welcome"),    
    body: i18n.t("onboarding.description"),
  },
  {
    icon: "🎵",
    title: i18n.t("onboarding.chantingDaily"),
    body: i18n.t("onboarding.chantingDailyDescription"),
  },
  {
    icon: "🔔",
    title: i18n.t("onboarding.prayerReminders"),    
    body: i18n.t("onboarding.prayerRemindersDescription"),
  },
];

export function OnboardingScreen({ onNext }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Pulse animations for the 3 decorative rings
  const onboardScreens = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  // Icon fade/scale
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    onboardScreens.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.05,
            duration: (3 + i) * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: (3 + i) * 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const advance = () => {
    if (step < slides.length - 1) {
      setAnimating(true);
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setStep((s) => s + 1);
        setAnimating(false);
        Animated.parallel([
          Animated.timing(iconOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(iconScale, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    } else {
      onNext();
    }
  };

  const slide = slides[step];
  const ringSizes = [180, 160, 140];

  return (
    <View style={styles.container}>
      {/* Atmospheric radial gradient */}
      <View style={styles.atmosphereTop} pointerEvents="none" />
      <View style={styles.atmosphereAccent} pointerEvents="none" />

      {/* Skip button */}
      <View style={styles.skipRow}>
        {step < slides.length - 1 && (
          <Pressable onPress={onNext}>
            <Text style={styles.skipText}>{i18n.t("onboarding.skip")}</Text>
          </Pressable>
        )}
      </View>

      {/* Illustration area */}
      <View style={styles.illustrationArea}>
        {/* Decorative rings */}
        <View style={styles.ringContainer}>
          {ringSizes.map((size, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ring,
                {
                  width: size,
                  height: size,
                  borderColor: `rgba(200,135,42,${0.08 + i * 0.06})`,
                  transform: [{ scale: onboardScreens[i] }],
                },
              ]}
            />
          ))}
          {/* Center circle */}
          <Animated.View
            style={[
              styles.centerCircle,
              { opacity: iconOpacity, transform: [{ scale: iconScale }] },
            ]}
          >
            <Text style={styles.slideIcon}>{slide.icon}</Text>
          </Animated.View>
        </View>

        {/* Text content */}
        <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
          <Text style={styles.bodyEn}>{slide.bodyEn}</Text>
        </Animated.View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === step ? 28 : 8,
                  backgroundColor: i === step ? Colors.gold : Colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <Pressable onPress={advance} style={styles.ctaWrapper}>
          <LinearGradient
            colors={[Colors.gold, Colors.red]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {step < slides.length - 1 ? i18n.t("onboarding.next") + " →" : i18n.t("onboarding.getStarted")}
            </Text>
          </LinearGradient>
        </Pressable>

        {step === slides.length - 1 && (
          <View>
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>{i18n.t("onboarding.loginText")} </Text>
              <Text style={styles.loginLink}>{i18n.t("onboarding.loginLink")}</Text>
            </View>
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>{i18n.t("onboarding.signupText")} </Text>
              <Text style={styles.loginLink}>{i18n.t("onboarding.signupLink")}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  atmosphereTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // Simulated with a subtle overlay — LinearGradient handles this on the bg
  },
  atmosphereAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    opacity: 0.4,
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 8,
  },
  skipText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  ringContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    position: "relative",
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  centerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(200,135,42,0.08)",
    borderWidth: 1,
    borderColor: "rgba(200,135,42,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  slideIcon: {
    fontSize: 48,
  },
  textBlock: {
    alignItems: "center",
  },
  subtitle: {
    color: Colors.goldBright,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  title: {
    color: Colors.cream,
    fontSize: 30,
    fontFamily: Fonts.bold,
    marginBottom: 16,
    lineHeight: 39,
    textAlign: "center",
  },
  body: {
    color: Colors.creamMuted,
    fontSize: 15,
    lineHeight: 25,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginBottom: 6,
  },
  bodyEn: {
    color: Colors.muted,
    fontSize: 12.5,
    lineHeight: 20,
    fontFamily: Fonts.italic,
    textAlign: "center",
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 4,
    borderRadius: 2,
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
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  loginText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  loginLink: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
});
