import { RemindersScreen } from "@/components/reminders-screen";
import { router } from "expo-router";

export default function Reminders() {
  return <RemindersScreen onBack={() => router.back()} />;
}
