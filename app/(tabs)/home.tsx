import { HomeScreen } from "@/components/home-screen";
import { usePlayerStore } from "@/store/player-store";
import { router } from "expo-router";

export default function Home() {
  const setTrack = usePlayerStore((s) => s.setTrack);

  return (
    <HomeScreen
      onChantSelect={(track) => {
        setTrack(track);
        router.navigate("/player" as any);
      }}
      onRemindersPress={() => router.navigate("/reminders" as any)}
    />
  );
}
