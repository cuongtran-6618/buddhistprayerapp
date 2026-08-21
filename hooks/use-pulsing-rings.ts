import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function usePulsingRings(sizes: number[]): Animated.Value[] {
  const anims = useRef(sizes.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.05, duration: (3 + i) * 1000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: (3 + i) * 1000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return anims;
}
