import { CreateReminderScreen } from "@/components/create-reminder-screen";
import { router, useLocalSearchParams } from "expo-router";

export default function CreateReminder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <CreateReminderScreen onBack={() => router.back()} reminderId={id} />;
}
