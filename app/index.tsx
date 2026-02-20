import { getCalendars, getLocales } from 'expo-localization';
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { i18n } from './lib/i18n';

export default function Index() {
  const { languageCode } = getLocales()[0];
  const calendars = getCalendars();

  console.log('Locales:', languageCode);
  console.log('Calendars:', calendars);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("ios.HELLO_NOTIFICATION_KEY")}</Text>
      <Link href="/chant" style={styles.link}>
        Go to Chant
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});