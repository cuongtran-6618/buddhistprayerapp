import { PlayerScreen } from "@/components/player-screen";
import { useChantingHistoryStore } from "@/store/chanting-history-store";
import { usePlayerStore } from "@/store/player-store";
import { router } from "expo-router";

export default function Player() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const recordCompletion = useChantingHistoryStore((state) => state.recordCompletion);

  if (!currentTrack) return null;

  return (
    <PlayerScreen
      track={currentTrack}
      onBack={() => router.back()}
      onComplete={() => recordCompletion(currentTrack.id)}
    />
  );
}
