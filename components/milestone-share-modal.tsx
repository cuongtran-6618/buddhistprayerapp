import { useI18n } from "@/lib/i18n";
import { MilestoneShareCard } from "@/components/milestone-share-card";
import { GoldGradient } from "@/components/ui/gold-gradient";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useAnalytics } from "@/hooks/use-analytics";
import { computeHeatmapGrid, useChantingHistoryStore } from "@/store/chanting-history-store";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";

interface MilestoneShareModalProps {
  streak: number | null;
  onClose: () => void;
}

export function MilestoneShareModal({ streak, onClose }: MilestoneShareModalProps) {
  const i18n = useI18n();
  const analytics = useAnalytics();
  const history = useChantingHistoryStore((state) => state.history);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const visible = streak != null;

  useEffect(() => {
    if (visible) analytics.capture({ type: "milestone_reached", streak: streak! });
  }, [visible, streak, analytics]);

  if (!visible) return null;

  const grid = computeHeatmapGrid(history, streak);

  const handleShare = async () => {
    setSharing(true);
    let uri: string | null = null;
    try {
      analytics.capture({ type: "share_sheet_opened", streak });
      uri = await captureRef(cardRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
    } catch {
      Alert.alert(i18n.t("milestone.share_error"), i18n.t("milestone.share_error_body"));
    } finally {
      if (uri) releaseCapture(uri);
      setSharing(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t("milestone.title", { count: streak })}</Text>
          <Text style={styles.subtitle}>{i18n.t("milestone.subtitle")}</Text>
        </View>

        <MilestoneShareCard ref={cardRef} streak={streak} grid={grid} />

        <View style={styles.actions}>
          <Pressable onPress={handleShare} disabled={sharing} style={styles.shareButtonWrapper}>
            <GoldGradient style={styles.shareButton}>
              <Text style={styles.shareButtonText}>{i18n.t("milestone.share")}</Text>
            </GoldGradient>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.laterText}>{i18n.t("milestone.maybe_later")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,10,7,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 24,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: Colors.cream,
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.creamMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  actions: {
    alignItems: "center",
    gap: 16,
  },
  shareButtonWrapper: {
    borderRadius: 999,
  },
  shareButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  shareButtonText: {
    color: Colors.cream,
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  laterText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
});
