import { Colors } from "@/constants/colors";
import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface LotusIconProps {
  size?: number;
  color?: string;
}

export function LotusIcon({ size = 24, color = Colors.gold }: LotusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C12 22 7 17 7 12C7 9 9 7 12 7C15 7 17 9 17 12C17 17 12 22 12 22Z"
        fill={color}
        fillOpacity={0.8}
      />
      <Path
        d="M12 22C12 22 4 16 4 10C4 7 7 5 10 6C8 8 8 11 10 13C10.5 13.5 11 14 11.5 14.5"
        fill={color}
        fillOpacity={0.5}
      />
      <Path
        d="M12 22C12 22 20 16 20 10C20 7 17 5 14 6C16 8 16 11 14 13C13.5 13.5 13 14 12.5 14.5"
        fill={color}
        fillOpacity={0.5}
      />
      <Circle cx={12} cy={7} r={1.5} fill={color} />
    </Svg>
  );
}
