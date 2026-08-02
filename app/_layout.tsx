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
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { PostHogProvider, usePostHog } from "posthog-react-native";

import { TRACKS } from "@/constants/tracks";
import { usePlayerStore } from "@/store/player-store";
import {
  ACTION_ACCEPT,
  ACTION_SNOOZE,
  setupNotificationCategory,
  snoozeReminder,
} from "@/hooks/use-notifications";

SplashScreen.preventAutoHideAsync();

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const posthog = usePostHog();
  const setTrack = usePlayerStore((s) => s.setTrack);
  const sessionStart = useRef<number | null>(null);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    sessionStart.current = Date.now();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sessionStart.current = Date.now();
      } else if (state === "background" || state === "inactive") {
        if (sessionStart.current) {
          posthog.capture("app_session", {
            duration_ms: Date.now() - sessionStart.current,
          });
          sessionStart.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [posthog]);

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
          const track = TRACKS.find((t) => t.id === data.trackId);
          if (track) {
            posthog.capture("reminder_opened");
            setTrack(track);
            router.navigate("/player" as any);
          }
        } else if (actionIdentifier === ACTION_SNOOZE) {
          const minutes = data.snoozeMinutes ?? 10;
          snoozeReminder(
            minutes,
            data.trackId ?? "",
            notification.request.content.title ?? "",
            data.reminderId ?? "",
            notification.request.content.body ?? ""
          );
        }
      }
    );

    return () => subscription.remove();
  }, [posthog, setTrack]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="player" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_300Light_Italic,
    BeVietnamPro_400Regular,
    BeVietnamPro_400Regular_Italic,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
      options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST }}
    >
      <AppShell fontsLoaded={fontsLoaded ?? false} />
    </PostHogProvider>
  );
}
