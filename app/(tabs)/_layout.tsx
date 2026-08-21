import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useI18n } from "@/lib/i18n";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const i18n = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 11,
        },
      }}
    >
      {/* Onboarding: hidden from tab bar, tab bar hidden while active */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: i18n.t("tabs.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chant"
        options={{
          title: i18n.t("tabs.chant"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "musical-notes" : "musical-notes-outline"} size={size} color={color} />
          ),
        }}
      />
       <Tabs.Screen
        name="reminders"
        options={{
          title: i18n.t("tabs.reminders"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-reminder"
        options={{
          title: "Create Reminder",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
