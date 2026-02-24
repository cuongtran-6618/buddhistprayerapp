import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={styles.frame}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.time}>9:41</Text>
        <View style={styles.notch} />
        <View style={styles.statusIcons}>
          {/* Signal bars */}
          <View style={styles.signalBars}>
            {[3, 4, 4, 4].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.signalBar,
                  { height: 8 + _ , opacity: i < 3 ? 1 : 0.3 },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 390,
    height: 844,
    backgroundColor: Colors.bg,
    borderRadius: 48,
    overflow: "hidden",
    position: "relative",
    // Web shadow via boxShadow is not supported in StyleSheet, handled inline for web
  },
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 12,
    zIndex: 100,
  },
  time: {
    color: Colors.cream,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
  },
  notch: {
    width: 120,
    height: 30,
    backgroundColor: Colors.bg,
    borderRadius: 20,
    position: "absolute",
    left: "50%" as unknown as number,
    top: 8,
  },
  statusIcons: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  signalBars: {
    flexDirection: "row",
    gap: 2,
    alignItems: "flex-end",
  },
  signalBar: {
    width: 3,
    backgroundColor: Colors.cream,
    borderRadius: 2,
  },
});
