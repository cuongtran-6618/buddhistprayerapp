import { OnboardingScreen } from "@/components/onboarding-screen";
import { useAppStore } from "@/store/app-store";
import { router, useRootNavigationState } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
  const hydrated = useAppStore((s) => s._hydrated);
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    if (hydrated && hasSeenOnboarding) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/home" as any);
    }
  }, [hydrated, hasSeenOnboarding, navigationState?.key]);

  if (!hydrated || hasSeenOnboarding) return null;

  return (
    <OnboardingScreen
      onNext={() => {
        setHasSeenOnboarding(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace("/home" as any);
      }}
    />
  );
}
