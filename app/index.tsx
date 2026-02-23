import { OnboardingScreen } from "@/components/onboarding-screen";
import { router } from "expo-router";

export default function Index() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <OnboardingScreen onNext={() => router.replace("/home" as any)} />;
}
