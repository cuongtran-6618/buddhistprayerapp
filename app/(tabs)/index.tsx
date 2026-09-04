import { WelcomeScreen } from "@/components/welcome-screen";
import { useAppStore } from "@/store/app-store";
import { Redirect } from "expo-router";

export default function Index() {
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const setHasSeenOnboarding = useAppStore(
    (state) => state.setHasSeenOnboarding,
  );
  const hydrated = useAppStore((state) => state._hydrated);

  if (!hydrated) return null;

  if (hasSeenOnboarding) {
    return <Redirect href="/home" />;
  }

  return <WelcomeScreen onStart={() => setHasSeenOnboarding(true)} />;
}
