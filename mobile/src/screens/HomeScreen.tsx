import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { colors, radii, spacing } from "@/theme";
import { Image } from "expo-image";
import CodeClothHover from "@/components/CodeClothHover";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const LOGO_RATIO = 1662 / 758;

export default function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();

  const logoWidth = width - 32;
  const logoHeight = logoWidth / LOGO_RATIO;
  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/MedTermRx_logo.svg")}
          contentFit="contain"
          style={{
            // width: logoWidth,
            // height: logoHeight,
            width: "100%",
            height: 170,
          }}
        />
        <CodeClothHover></CodeClothHover>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.primaryButtonText}>GET START</Text>
        </TouchableOpacity>
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
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
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
