import { ChantListScreen } from "@/components/chant-list-screen";
import { usePlayerStore } from "@/store/player-store";
import { router } from "expo-router";

export default function Chant() {
  const setTrack = usePlayerStore((state) => state.setTrack);

  return (
    <ChantListScreen
      onChantSelect={(track) => {
        setTrack(track);
        router.navigate("/player" as any);
      }}
    />
  );
}
