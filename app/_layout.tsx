import {
  BeVietnamPro_300Light_Italic,
  BeVietnamPro_400Regular,
  BeVietnamPro_400Regular_Italic,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { TRACKS } from "@/constants/tracks";
import { usePlayerStore } from "@/store/player-store";
import {
  ACTION_ACCEPT,
  ACTION_SNOOZE,
  setupNotificationCategory,
  snoozeReminder,
} from "@/hooks/use-notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_300Light_Italic,
    BeVietnamPro_400Regular,
    BeVietnamPro_400Regular_Italic,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  const setTrack = usePlayerStore((s) => s.setTrack);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Register notification category and wire up the response listener once.
  useEffect(() => {
    setupNotificationCategory();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data as {
          trackId?: string;
          reminderId?: string;
          snoozeMinutes?: number;
        };

        if (
          actionIdentifier === ACTION_ACCEPT ||
          actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ) {
          // Open the player for the associated track.
          const track = TRACKS.find((t) => t.id === data.trackId);
          if (track) {
            setTrack(track);
            router.navigate("/player" as any);
          }
        } else if (actionIdentifier === ACTION_SNOOZE) {
          // Reschedule a one-time notification for snoozeMinutes from now.
          const minutes = data.snoozeMinutes ?? 10;
          snoozeReminder(
            minutes,
            data.trackId ?? "",
            notification.request.content.title ?? "",
            data.reminderId ?? ""
          );
        }
      }
    );

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="create-reminder" />
      <Stack.Screen name="player" />
    </Stack>
  );
}
