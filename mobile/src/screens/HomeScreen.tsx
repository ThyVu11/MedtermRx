import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import CodeCloth from "./CodeCloth";
import { colors, radii, spacing } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>MedTerm Study</Text>
        <Text style={styles.subtitle}>
          Learn medical terminology, one root at a time.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.primaryButtonText}>GET START</Text>
        </TouchableOpacity>
        <View style={styles.animationArea}>
          <CodeCloth maxClothWidth={340} maxClothHeight={250} fontSize={9} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F766E",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  buttons: { gap: 14 },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primary: { backgroundColor: "#0F766E" },
  secondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#0F766E",
  },
  buttonTextPrimary: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  buttonTextSecondary: { color: "#0F766E", fontSize: 16, fontWeight: "700" },
  animationArea: {
    flex: 1,
    minHeight: 320,
    width: 350,
  },

  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    width: 350,
  },

  primaryButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 14,
  },
});
