import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radii, spacing, typography } from "@/theme";
import { matchTermsInText } from "@/utils/matchTerms";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { fetchTerms } from "@/features/termsSlice";
import type { Term } from "@/types";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

/**
 * PRODUCTION NOTE — on-device OCR:
 * This screen wires up the camera and the "text -> matched terms" pipeline
 * end-to-end, but ships with a manual fallback for the OCR step itself,
 * because real-time text recognition needs a native ML module
 * (e.g. react-native-vision-camera + a frame processor calling Google
 * ML Kit / Apple Vision) that must be compiled into a dev build — it
 * can't run inside Expo Go or a preview environment.
 *
 * To wire up real OCR:
 *   1. npx expo install react-native-vision-camera vision-camera-text-recognition
 *   2. Create a dev build (eas build --profile development)
 *   3. Replace the manual text box below with a frame processor that
 *      calls a text-recognition function on each frame and feeds the
 *      result into matchTermsInText() exactly as this screen already does.
 * Everything downstream of "raw text" (matching, dissection, add-to-deck)
 * is already fully wired and works today.
 */
export default function ScannerScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const terms = useAppSelector((state) => state.terms.items);
  const termsStatus = useAppSelector((state) => state.terms.status);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualText, setManualText] = useState("");
  const [matches, setMatches] = useState<Term[] | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (termsStatus === "idle") {
      dispatch(fetchTerms());
    }
  }, [dispatch, termsStatus]);

  const runScan = (text: string) => {
    setMatches(matchTermsInText(terms, text));
  };

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <View style={styles.permissionCard}>
          <Text style={styles.title}>Camera access needed</Text>
          <Text style={styles.subtitle}>
            RootRx scans your textbook or notes to instantly dissect medical terms it finds.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Enable camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.scanFrame} pointerEvents="none" />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Scan &amp; Dissect</Text>
        <Text style={styles.subtitle}>
          Point the camera at a page, then paste or type the text you see below to run the
          dissector (live OCR requires a dev build — see note in the code).
        </Text>

        <TextInput
          style={styles.textArea}
          placeholder="e.g. “Patient presented with dyspnea and bradycardia…”"
          placeholderTextColor={colors.textSecondary}
          value={manualText}
          onChangeText={setManualText}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={() => runScan(manualText)}>
          <Text style={styles.primaryButtonText}>Dissect this text</Text>
        </TouchableOpacity>

        {matches && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsLabel}>
              {matches.length > 0
                ? `Found ${matches.length} term${matches.length === 1 ? "" : "s"}`
                : "No known terms found in that text"}
            </Text>
            {matches.map((term) => (
              <TouchableOpacity
                key={term.id}
                style={styles.matchCard}
                onPress={() => navigation.navigate("TermDetail", { termId: term.id })}
              >
                <Text style={styles.matchWord}>{term.word}</Text>
                <Text style={styles.matchParts}>
                  {term.parts.map((p) => p.text).join(" + ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  cameraWrap: {
    height: 260,
    backgroundColor: colors.ink,
    position: "relative",
  },
  camera: { flex: 1 },
  scanFrame: {
    position: "absolute",
    top: 40,
    left: 32,
    right: 32,
    bottom: 40,
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: radii.md,
  },
  body: { padding: spacing.lg },
  title: { ...typography.display, fontSize: 22, color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  textArea: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  primaryButtonText: { color: colors.textOnBrand, fontWeight: "700" },
  permissionCard: {
    margin: spacing.lg,
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  resultsSection: { marginTop: spacing.lg },
  resultsLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  matchCard: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  matchWord: { ...typography.display, fontSize: 16, color: colors.ink },
  matchParts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
