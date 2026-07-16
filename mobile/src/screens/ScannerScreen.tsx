import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { colors, radii, spacing, typography } from "@/theme";
import { matchTermsInText } from "@/utils/matchTerms";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { fetchTerms } from "@/features/termsSlice";
import type { Term } from "@/types/types";
import type { RootStackParamList } from "@/types/types";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

type OcrResponse = {
  text: string;
};

type ScanStatus =
  | "idle"
  | "capturing"
  | "recognizing"
  | "matching"
  | "success"
  | "error";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ScannerScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();

  const terms = useAppSelector((state) => state.terms.items);

  const termsStatus = useAppSelector((state) => state.terms.status);

  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);

  const [cameraReady, setCameraReady] = useState(false);

  const [manualText, setManualText] = useState("");

  const [matches, setMatches] = useState<Term[] | null>(null);

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [status, setStatus] = useState<ScanStatus>("idle");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (termsStatus === "idle") {
      dispatch(fetchTerms());
    }
  }, [dispatch, termsStatus]);

  const isBusy =
    status === "capturing" || status === "recognizing" || status === "matching";

  const runTermMatching = useCallback(
    (text: string) => {
      const cleanText = text.trim();

      if (!cleanText) {
        setMatches([]);
        return;
      }

      setStatus("matching");

      const foundTerms = matchTermsInText(terms, cleanText);

      setMatches(foundTerms);
      setStatus("success");
    },
    [terms],
  );

  const uploadPhotoForOcr = async (uri: string): Promise<string> => {
    if (!API_URL) {
      throw new Error("EXPO_PUBLIC_API_URL is not configured.");
    }

    const formData = new FormData();

    formData.append("image", {
      uri,
      name: `medical-scan-${Date.now()}.jpg`,
      type: "image/jpeg",
    } as unknown as Blob);

    const response = await fetch(`${API_URL}/api/ocr`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const responseBody = (await response.json()) as
      | OcrResponse
      | { error?: string };

    if (!response.ok) {
      throw new Error(
        "error" in responseBody && responseBody.error
          ? responseBody.error
          : `OCR request failed with status ${response.status}.`,
      );
    }

    if (!("text" in responseBody) || typeof responseBody.text !== "string") {
      throw new Error("The OCR server returned an invalid response.");
    }

    return responseBody.text;
  };

  const captureAndScan = async () => {
    if (isBusy) {
      return;
    }

    if (!cameraReady) {
      Alert.alert("Camera not ready", "Wait a moment and try again.");
      return;
    }

    if (!cameraRef.current) {
      Alert.alert("Camera unavailable", "The camera could not be accessed.");
      return;
    }

    try {
      setErrorMessage(null);
      setMatches(null);
      setStatus("capturing");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error("The camera did not return a photo.");
      }

      setPhotoUri(photo.uri);
      setStatus("recognizing");

      const recognizedText = await uploadPhotoForOcr(photo.uri);

      setManualText(recognizedText);
      runTermMatching(recognizedText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to scan the image.";

      setStatus("error");
      setErrorMessage(message);
    }
  };

  const scanEditedText = () => {
    setErrorMessage(null);
    runTermMatching(manualText);
  };

  const resetScan = () => {
    setManualText("");
    setMatches(null);
    setPhotoUri(null);
    setErrorMessage(null);
    setStatus("idle");
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <View style={styles.permissionCard}>
          <Text style={styles.title}>Camera access needed</Text>

          <Text style={styles.subtitle}>
            RootRx scans textbooks and notes to identify and dissect medical
            terms.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
          >
            <Text style={styles.primaryButtonText}>Enable camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cameraWrap}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />

          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanFrame}>
              <Text style={styles.frameLabel}>
                Position medical text inside this frame
              </Text>
            </View>
          </View>

          {isBusy && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.textOnBrand} />

              <Text style={styles.loadingText}>
                {status === "capturing"
                  ? "Capturing image…"
                  : status === "recognizing"
                    ? "Recognizing text…"
                    : "Finding medical terms…"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Scan &amp; Dissect</Text>

          <Text style={styles.subtitle}>
            Hold the camera steady over a page and tap Scan. You can review and
            edit the recognized text before matching it.
          </Text>

          <TouchableOpacity
            style={[
              styles.captureButton,
              (!cameraReady || isBusy) && styles.disabledButton,
            ]}
            disabled={!cameraReady || isBusy}
            onPress={captureAndScan}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.textOnBrand} />
            ) : (
              <Text style={styles.primaryButtonText}>Scan medical text</Text>
            )}
          </TouchableOpacity>

          {photoUri && (
            <View style={styles.previewSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>CAPTURED IMAGE</Text>

                <TouchableOpacity onPress={resetScan}>
                  <Text style={styles.resetText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: photoUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.editorSection}>
            <Text style={styles.sectionLabel}>RECOGNIZED TEXT</Text>

            <TextInput
              style={styles.textArea}
              placeholder={
                "Recognized text will appear here. You can also type or paste text manually."
              }
              placeholderTextColor={colors.textSecondary}
              value={manualText}
              onChangeText={setManualText}
              multiline
              numberOfLines={6}
              editable={!isBusy}
              autoCapitalize="sentences"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                (!manualText.trim() || isBusy || termsStatus !== "succeeded") &&
                  styles.disabledSecondary,
              ]}
              disabled={
                !manualText.trim() || isBusy || termsStatus !== "succeeded"
              }
              onPress={scanEditedText}
            >
              <Text style={styles.secondaryButtonText}>
                Dissect edited text
              </Text>
            </TouchableOpacity>
          </View>

          {termsStatus === "loading" && (
            <View style={styles.infoCard}>
              <ActivityIndicator size="small" color={colors.teal} />
              <Text style={styles.infoText}>Loading medical terminology…</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Scan unsuccessful</Text>

              <Text style={styles.errorText}>{errorMessage}</Text>

              <Text style={styles.errorSuggestion}>
                Try better lighting, hold the camera parallel to the page, or
                enter the text manually.
              </Text>
            </View>
          )}

          {matches !== null && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsLabel}>
                {matches.length > 0
                  ? `Found ${matches.length} medical term${
                      matches.length === 1 ? "" : "s"
                    }`
                  : "No known medical terms found"}
              </Text>

              {matches.map((term) => (
                <TouchableOpacity
                  key={term.id}
                  style={styles.matchCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate("TermDetail", {
                      termId: term.id,
                    })
                  }
                >
                  <View style={styles.matchCardHeader}>
                    <Text style={styles.matchWord}>{term.word}</Text>

                    <Text style={styles.viewDetailsText}>View</Text>
                  </View>

                  {term.parts.length > 0 && (
                    <View style={styles.partsRow}>
                      {term.parts.map((part, index) => (
                        <React.Fragment
                          key={`${term.id}-${part.text}-${index}`}
                        >
                          {index > 0 && <Text style={styles.plusSign}>+</Text>}

                          <View style={styles.partChip}>
                            <Text style={styles.partText}>{part.text}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  )}

                  <Text style={styles.matchDefinition} numberOfLines={2}>
                    {term.plainDefinition ?? term.definition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },

  scrollContent: {
    paddingBottom: spacing.xl,
  },

  cameraWrap: {
    height: 300,
    backgroundColor: colors.ink,
    position: "relative",
    overflow: "hidden",
  },

  camera: {
    flex: 1,
  },

  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  scanFrame: {
    height: 160,
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "flex-end",
    padding: spacing.sm,
  },

  frameLabel: {
    color: colors.textOnBrand,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 11,
    overflow: "hidden",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  loadingText: {
    marginTop: spacing.sm,
    color: colors.textOnBrand,
    fontWeight: "600",
  },

  body: {
    padding: spacing.lg,
  },

  title: {
    ...typography.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.md,
  },

  captureButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
  },

  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },

  primaryButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.5,
  },

  previewSection: {
    marginTop: spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  sectionLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  resetText: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: 12,
  },

  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: radii.md,
    backgroundColor: colors.paperDim,
  },

  editorSection: {
    marginTop: spacing.lg,
  },

  textArea: {
    minHeight: 130,
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },

  disabledSecondary: {
    opacity: 0.45,
  },

  secondaryButtonText: {
    color: colors.teal,
    fontWeight: "700",
  },

  permissionCard: {
    margin: spacing.lg,
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },

  infoCard: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  errorCard: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#E8B5B5",
  },

  errorTitle: {
    fontWeight: "700",
    color: "#8B2525",
    marginBottom: 4,
  },

  errorText: {
    color: "#8B2525",
    fontSize: 13,
    lineHeight: 18,
  },

  errorSuggestion: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  resultsSection: {
    marginTop: spacing.lg,
  },

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

  matchCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  matchWord: {
    ...typography.display,
    fontSize: 17,
    color: colors.ink,
  },

  viewDetailsText: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: 12,
  },

  partsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: 4,
  },

  partChip: {
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },

  partText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: "600",
  },

  plusSign: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  matchDefinition: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});
