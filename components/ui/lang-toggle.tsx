import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { Pressable, StyleSheet, Text } from "react-native";

export function LangToggle() {
  const i18n = useI18n();
  const { language, setLanguage } = useAppStore();
  return (
    <Pressable
      style={styles.button}
      onPress={() => setLanguage(language === "vi" ? "en" : "vi")}
      accessibilityLabel={i18n.t("a11y.switch_language")}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{language.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Colors.gold,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
  },
});
