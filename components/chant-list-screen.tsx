import { LotusIcon } from "@/components/icons/lotus-icon";
import { GoldGradient } from "@/components/ui/gold-gradient";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Track } from "@/constants/tracks";
import { useAnalytics } from "@/hooks/use-analytics";
import { useTracks } from "@/hooks/use-tracks";
import { useI18n } from "@/lib/i18n";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface ChantListScreenProps {
  onChantSelect: (track: Track) => void;
}

export function ChantListScreen({ onChantSelect }: ChantListScreenProps) {
  const i18n = useI18n();
  const analytics = useAnalytics();
  const { tracks } = useTracks();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>{i18n.t("chant.heading")}</Text>
        <View style={styles.list}>
          {tracks.map((track) => (
            <ChantRow
              key={track.id}
              track={track}
              onPress={() => {
                analytics.capture({ type: 'chant_selected', trackId: track.id, source: 'chant_list' });
                onChantSelect(track);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ChantRow({ track, onPress }: { track: Track; onPress: () => void }) {
  return (
    <View style={styles.row}>
      <LotusIcon size={22} color={track.isPremium ? Colors.goldDim : Colors.gold} />
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowTitle}>{track.title}</Text>
          {track.isPremium && (
            <GoldGradient style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </GoldGradient>
          )}
        </View>
        <Text style={styles.rowSubtitle}>{track.subtitle}</Text>
        {track.durationLabel && (
          <Text style={styles.rowDuration}>🕐 {track.durationLabel}</Text>
        )}
      </View>
      <Pressable onPress={onPress} style={styles.playButton}>
        <GoldGradient style={styles.playButtonGradient}>
          <Text style={styles.playIcon}>▶</Text>
        </GoldGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  heading: {
    color: Colors.cream,
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    color: Colors.cream,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  rowSubtitle: {
    color: Colors.muted,
    fontSize: 11.5,
    fontFamily: Fonts.italic,
    marginTop: 3,
  },
  rowDuration: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 6,
  },
  proBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: Colors.cream,
    fontSize: 9,
    fontFamily: Fonts.bold,
  },
  playButton: {
    borderRadius: 10,
    overflow: "hidden",
  },
  playButtonGradient: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: Colors.cream,
    fontSize: 14,
  },
});
