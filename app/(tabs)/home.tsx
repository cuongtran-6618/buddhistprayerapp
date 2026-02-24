import { HomeScreen } from "@/components/home-screen";
import { router } from "expo-router";

export default function Home() {
  return <HomeScreen onChantSelect={() => router.push("/chant")} />;
}
