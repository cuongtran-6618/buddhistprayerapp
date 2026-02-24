import { PlayerScreen } from "@/components/player-screen";
import { router } from "expo-router";

export default function Chant() {
  return <PlayerScreen onBack={() => router.back()} />;
}