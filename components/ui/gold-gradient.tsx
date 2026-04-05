/**
 * GoldGradient
 *
 * The app's standard gold → red diagonal gradient, used for all primary
 * interactive surfaces (play buttons, save button, FAB, PRO badge).
 *
 * Replaces repeated inline `<LinearGradient colors={[Colors.gold, Colors.red]} …>`
 * so the brand gradient is defined in exactly one place.
 */
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

interface GoldGradientProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GoldGradient({ style, children }: GoldGradientProps) {
  return (
    <LinearGradient
      colors={[Colors.gold, Colors.red]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
