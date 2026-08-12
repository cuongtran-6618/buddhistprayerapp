import { WelcomeScreen } from "@/components/welcome-screen";
import { useAppStore } from "@/store/app-store";
import { Redirect } from "expo-router";

export default function Index() {
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
  const hydrated = useAppStore((s) => s._hydrated);

  if (!hydrated) return null;

  if (hasSeenOnboarding) {
    return <Redirect href="/home" />;
  }

  return (
    <WelcomeScreen
      onStart={() => setHasSeenOnboarding(true)}
    />
  );
}
