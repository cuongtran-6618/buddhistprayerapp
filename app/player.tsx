import { PlayerScreen } from "@/components/player-screen";
import { usePlayerStore } from "@/store/player-store";
import { router } from "expo-router";

export default function Player() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  if (!currentTrack) return null;

  return (
    <PlayerScreen
      track={currentTrack}
      onBack={() => router.back()}
    />
  );
}
