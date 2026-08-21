import { useI18n } from "@/lib/i18n";
import { LotusIcon } from "@/components/icons/lotus-icon";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { HeatmapCell } from "@/store/chanting-history-store";
import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

const CARD_WIDTH = 320;
const CELL_SIZE = 13;
const CELL_GAP = 4;

interface MilestoneShareCardProps {
  streak: number;
  grid: (HeatmapCell | null)[][];
}

export const MilestoneShareCard = forwardRef<View, MilestoneShareCardProps>(
  function MilestoneShareCard({ streak, grid }, ref) {
    const i18n = useI18n();
    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <LinearGradient
          colors={["rgba(200,135,42,0.18)", "transparent"]}
          style={styles.glowTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "rgba(139,26,26,0.1)"]}
          style={styles.glowBottom}
          pointerEvents="none"
        />

        <View style={styles.brandRow}>
          <LotusIcon size={28} color={Colors.goldBright} />
          <Text style={styles.brand}>Chu Đại Bi</Text>
        </View>

        <View style={styles.streakBlock}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>{i18n.t("milestone.day_streak")}</Text>
        </View>

        <View style={styles.grid}>
          {grid.map((column, ci) => (
            <View key={ci} style={styles.column}>
              {column.map((cell, ri) => (
                <View key={ri} style={[styles.cell, cell?.filled && styles.cellFilled]} />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    aspectRatio: 9 / 16,
    backgroundColor: Colors.bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    padding: 24,
  },
  glowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  glowBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "absolute",
    top: 24,
  },
  brand: {
    color: Colors.cream,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  streakBlock: {
    alignItems: "center",
  },
  streakNumber: {
    color: Colors.goldBright,
    fontSize: 72,
    fontFamily: Fonts.bold,
    lineHeight: 76,
  },
  streakLabel: {
    color: Colors.creamMuted,
    fontSize: 14,
    fontFamily: Fonts.medium,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    gap: CELL_GAP,
  },
  column: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellFilled: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldBright,
  },
});
