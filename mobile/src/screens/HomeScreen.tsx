import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Linking,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { colors, radii, spacing } from "../theme";
import { Image } from "expo-image";
import CodeCloth from "../components/CodeCloth";
import { useAppSelector } from "../hooks";
import AboutScreen from "./AboutScreen";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const LOGO_RATIO = 1662 / 758;

export default function HomeScreen({ navigation }: Props) {
  const [aboutVisible, setAboutVisible] = useState(false);
  const termsStatus = useAppSelector((state) => state.terms.status);
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
        <CodeCloth></CodeCloth>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            termsStatus !== "succeeded" && styles.disabledButton,
          ]}
          disabled={termsStatus !== "succeeded"}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.primaryButtonText}>
            {termsStatus === "loading" ? "LOADING TERMS..." : "GET START"}
          </Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          accessibilityRole="button"
          style={styles.aboutButton}
          onPress={() => setAboutVisible(true)}
        >
          <Text style={styles.aboutLink}>About & data sources</Text>
        </TouchableOpacity> */}
      </View>
      {/* <Modal
        visible={aboutVisible}
        animationType="slide"
        onRequestClose={() => setAboutVisible(false)}
      >
        <SafeAreaView style={styles.aboutSafe}>
          <ScrollView contentContainerStyle={styles.aboutContent}>
            <Text accessibilityRole="header" style={styles.aboutTitle}>
              About & data sources
            </Text>
            <Text style={styles.aboutParagraph}>
              MedTerm Study is an educational medical terminology study tool.
              It is not intended to diagnose or treat medical conditions or
              provide medical advice. Consult a qualified healthcare professional
              for medical concerns.
            </Text>
            <Text accessibilityRole="header" style={styles.aboutHeading}>
              Medical Subject Headings (MeSH)
            </Text>
            <Text style={styles.aboutParagraph}>
              Includes information derived from Medical Subject Headings (MeSH),
              U.S. National Library of Medicine (NLM).
            </Text>
            <Text style={styles.aboutParagraph}>
              This app may not reflect the most current or accurate MeSH data
              available from NLM. NLM does not endorse this app.
            </Text>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Visit the National Library of Medicine MeSH website"
              style={styles.aboutButton}
              onPress={() => {
                Linking.openURL("https://www.nlm.nih.gov/mesh/meshhome.html").catch(() => {
                  Alert.alert("Unable to open link", "Please try again later.");
                });
              }}
            >
              <Text style={styles.aboutLink}>Visit the NLM MeSH website</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Read the MedTerm Study privacy policy"
              style={styles.aboutButton}
              onPress={() => {
                Linking.openURL("https://medterm.expo.app/privacy.html").catch(() => {
                  Alert.alert("Unable to open privacy policy", "Please try again later.");
                });
              }}
            >
              <Text style={styles.aboutLink}>Privacy policy</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close About and data sources"
            style={styles.aboutClose}
            onPress={() => setAboutVisible(false)}
          >
            <Text style={styles.primaryButtonText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal> */}
      <AboutScreen />
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
  disabledButton: {
    opacity: 0.5,
  },
});
