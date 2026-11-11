import { useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii } from "../theme";

export default function AboutScreen() {
  const [aboutVisible, setAboutVisible] = useState(false);
  return (
    <View>
      <View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.button}
          onPress={() => setAboutVisible(true)}
        >
          <Text style={styles.link}>About & data sources</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={aboutVisible}
        animationType="slide"
        onRequestClose={() => setAboutVisible(false)}
      >
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>
              About & data sources
            </Text>
            <Text style={styles.paragraph}>
              MedTerm Study is an educational medical terminology study tool. It
              is not intended to diagnose or treat medical conditions or provide
              medical advice. Consult a qualified healthcare professional for
              medical concerns.
            </Text>
            <Text accessibilityRole="header" style={styles.heading}>
              Medical Subject Headings (MeSH)
            </Text>
            <Text style={styles.paragraph}>
              Includes information derived from Medical Subject Headings (MeSH),
              U.S. National Library of Medicine (NLM).
            </Text>
            <Text style={styles.paragraph}>
              This app may not reflect the most current or accurate MeSH data
              available from NLM. NLM does not endorse this app.
            </Text>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Visit the National Library of Medicine MeSH website"
              style={styles.button}
              onPress={() => {
                Linking.openURL(
                  "https://www.nlm.nih.gov/mesh/meshhome.html",
                ).catch(() => {
                  Alert.alert("Unable to open link", "Please try again later.");
                });
              }}
            >
              <Text style={styles.link}>Visit the NLM MeSH website</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Read the MedTerm Study privacy policy"
              style={styles.button}
              onPress={() => {
                Linking.openURL("https://medterm.expo.app/privacy.html").catch(
                  () => {
                    Alert.alert(
                      "Unable to open privacy policy",
                      "Please try again later.",
                    );
                  },
                );
              }}
            >
              <Text style={styles.link}>Privacy policy</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close About and data sources"
            style={styles.close}
            onPress={() => setAboutVisible(false)}
          >
            <Text style={styles.primaryButtonText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  //   safe: { flex: 1, backgroundColor: "#F0FDFA" },
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#0F766E" },
  heading: { fontSize: 18, fontWeight: "700", color: "#0F766E" },
  paragraph: { fontSize: 16, lineHeight: 25, color: "#334155" },
  button: { paddingVertical: 14, paddingHorizontal: 8 },
  link: {
    fontSize: 16,
    color: "#0F766E",
    textDecorationLine: "underline",
  },
  close: {
    margin: 24,
    padding: 16,
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 14,
  },
});
