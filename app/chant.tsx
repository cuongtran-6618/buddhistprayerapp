import { StyleSheet, Text, View } from "react-native";

export default function Chant() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chant.</Text>
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