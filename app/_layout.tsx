import {
  BeVietnamPro_300Light_Italic,
  BeVietnamPro_400Regular,
  BeVietnamPro_400Regular_Italic,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import * as Sentry from "@sentry/react-native";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { AppState, Text, View } from "react-native";
import { PostHogProvider } from "posthog-react-native";
import { useAnalytics } from "@/hooks/use-analytics";
import { Colors } from "@/constants/colors";

import { useTracks } from "@/hooks/use-tracks";
import { usePlayerStore } from "@/store/player-store";
import {
  ACTION_ACCEPT,
  ACTION_SNOOZE,
  setupNotificationCategory,
  snoozeReminder,
} from "@/hooks/use-notifications";

Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });

SplashScreen.preventAutoHideAsync();

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const analytics = useAnalytics();
  const setTrack = usePlayerStore((state) => state.setTrack);
  const { getTrackById } = useTracks();
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
          analytics.capture({ type: 'app_session', durationMs: Date.now() - sessionStart.current });
          sessionStart.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [analytics]);

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
          if (!data.trackId) {
            analytics.capture({ type: 'reminder_open_invalid', reason: 'missing_track_id' });
            return;
          }
          const track = getTrackById(data.trackId);
          if (!track) {
            analytics.capture({ type: 'reminder_open_invalid', reason: 'unknown_track_id' });
            return;
          }
          if (!data.reminderId) {
            analytics.capture({ type: 'reminder_open_invalid', reason: 'missing_reminder_id' });
            // warning, not a block — still open the player
          } else {
            analytics.capture({ type: 'reminder_opened', reminderId: data.reminderId });
          }
          setTrack(track);
          router.navigate("/player" as any);
        } else if (actionIdentifier === ACTION_SNOOZE) {
          const minutes = data.snoozeMinutes ?? 10;
          snoozeReminder(
            minutes,
            data.trackId ?? "",
            notification.request.content.title ?? "",
            data.reminderId ?? "",
            notification.request.content.body ?? "",
          ).catch(console.warn);
        }
      },
    );

    return () => subscription.remove();
  }, [analytics, setTrack, getTrackById]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

function CrashFallback() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text style={{ color: Colors.cream, fontSize: 18, textAlign: "center", marginBottom: 8 }}>
        Something went wrong
      </Text>
      <Text style={{ color: Colors.creamMuted, fontSize: 14, textAlign: "center" }}>
        Please restart the app
      </Text>
    </View>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_300Light_Italic,
    BeVietnamPro_400Regular,
    BeVietnamPro_400Regular_Italic,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  return (
    <Sentry.ErrorBoundary fallback={<CrashFallback />}>
      <PostHogProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
        options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST }}
      >
        <AppShell fontsLoaded={fontsLoaded ?? false} />
      </PostHogProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
