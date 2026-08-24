/**
 * usePlayerAnimations
 *
 * Encapsulates all Animated API loops for the player screen:
 *   - Outer mandala ring slow clockwise rotation
 *   - Middle mandala ring slow counter-clockwise rotation
 *   - Center lotus breathing (scale pulse)
 *   - Active line glow pulse (opacity)
 *
 * All loops start when `playing` becomes true and stop (with a snap-back)
 * when `playing` becomes false. Returns the raw Animated.Values and their
 * interpolated rotation strings for direct use in JSX transforms.
 */

import {
  BREATHE_DURATION_MS,
  GLOW_PULSE_DURATION_MS,
  MANDALA_MIDDLE_DURATION_MS,
  MANDALA_OUTER_DURATION_MS,
} from "@/constants/animation";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

interface PlayerAnimations {
  breatheAnim: Animated.Value;
  activeGlowAnim: Animated.Value;
  outerRotateDeg: Animated.AnimatedInterpolation<string>;
  middleRotateDeg: Animated.AnimatedInterpolation<string>;
}

export function usePlayerAnimations(playing: boolean): PlayerAnimations {
  const breatheAnim    = useRef(new Animated.Value(1)).current;
  const outerRotate    = useRef(new Animated.Value(0)).current;
  const middleRotate   = useRef(new Animated.Value(0)).current;
  const activeGlowAnim = useRef(new Animated.Value(0.6)).current;

  const outerRotateAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const middleRotateAnim = useRef<Animated.CompositeAnimation | null>(null);
  const breatheLoopAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopAnim     = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (playing) {
      breatheLoopAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim,    { toValue: 1.04, duration: BREATHE_DURATION_MS,        useNativeDriver: true }),
          Animated.timing(breatheAnim,    { toValue: 1,    duration: BREATHE_DURATION_MS,        useNativeDriver: true }),
        ])
      );
      breatheLoopAnim.current.start();

      outerRotateAnim.current = Animated.loop(
        Animated.timing(outerRotate,  { toValue: 1, duration: MANDALA_OUTER_DURATION_MS,  easing: Easing.linear, useNativeDriver: true })
      );
      outerRotateAnim.current.start();

      middleRotateAnim.current = Animated.loop(
        Animated.timing(middleRotate, { toValue: 1, duration: MANDALA_MIDDLE_DURATION_MS, easing: Easing.linear, useNativeDriver: true })
      );
      middleRotateAnim.current.start();

      glowLoopAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(activeGlowAnim, { toValue: 1,   duration: GLOW_PULSE_DURATION_MS, useNativeDriver: true }),
          Animated.timing(activeGlowAnim, { toValue: 0.6, duration: GLOW_PULSE_DURATION_MS, useNativeDriver: true }),
        ])
      );
      glowLoopAnim.current.start();
    } else {
      breatheLoopAnim.current?.stop();
      outerRotateAnim.current?.stop();
      middleRotateAnim.current?.stop();
      glowLoopAnim.current?.stop();
      // Snap lotus back to resting scale
      Animated.timing(breatheAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [playing]);

  const outerRotateDeg  = outerRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg",  "360deg"]  });
  const middleRotateDeg = middleRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });

  return { breatheAnim, activeGlowAnim, outerRotateDeg, middleRotateDeg };
}
