import { CreateReminderScreen } from "@/components/create-reminder-screen";
import { router, useLocalSearchParams } from "expo-router";

export default function CreateReminder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goToReminders = () => router.navigate("/reminders" as any);
  return (
    <CreateReminderScreen
      onBack={goToReminders}
      onSave={goToReminders}
      reminderId={id}
    />
  );
}
