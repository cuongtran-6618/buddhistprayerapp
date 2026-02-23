import { Colors } from "@/constants/colors";
import React from "react";
import Svg, { Path } from "react-native-svg";

interface BellIconProps {
  size?: number;
  color?: string;
}

export function BellIcon({ size = 20, color = Colors.cream }: BellIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}
