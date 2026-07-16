import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Category, RootStackParamList, Term } from "../types/types";
import { searchTerms } from "../api/terms";
import { ORGAN_LOCATIONS } from "../data/organLocations";
import MnemonicCard from "@/components/MnemonicCard";

type Props = NativeStackScreenProps<RootStackParamList, "OrganDetail">;

export default function OrganDetailScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const organ = ORGAN_LOCATIONS.find((o) => o.category === category);
  const [terms, setTerms] = useState<Term[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTerms = async (): Promise<void> => {
    setLoading(true);
    setIndex(0);
    let choosedCategory: Category = category.toLowerCase() as Category;

    try {
      const results = await searchTerms("", choosedCategory);

      if (loading) {
        setTerms(results);
      }
    } catch (error) {
      console.error("Failed to load organ terms:", error);
      if (loading) {
        setTerms([]);
      }
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: organ ? `${organ.label} · ${category}` : category,
    });

    void loadTerms();
  }, [category, navigation, organ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (terms.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No terms found for this region.</Text>
      </View>
    );
  }

  const atStart = index === 0;
  const atEnd = index === terms.length - 1;

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.progress}>
            {index + 1} / {terms.length} at the {organ?.label ?? category} —{" "}
            {organ?.category}
          </Text>

          <MnemonicCard
            term={terms[index]}
            hint={`Picture this at the ${organ?.label ?? category}: ${terms[index].examples ?? terms[index].definition}`}
            hintLabel="Anchor point"
            key={terms[index].id}
          />

          <View style={styles.nav}>
            <Pressable
              style={[styles.navButton, atStart && styles.navButtonDisabled]}
              disabled={atStart}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <Text style={styles.navText}>Previous</Text>
            </Pressable>
            <Pressable
              style={[styles.navButton, atEnd && styles.navButtonDisabled]}
              disabled={atEnd}
              onPress={() => setIndex((i) => Math.min(terms.length - 1, i + 1))}
            >
              <Text style={styles.navText}>Next</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
  },
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 16 },
  progress: { textAlign: "center", color: "#6B7280", fontWeight: "600" },
  nav: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  navButton: {
    flex: 1,
    backgroundColor: "#0F766E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  navButtonDisabled: { backgroundColor: "#A7C7C3" },
  navText: { color: "#fff", fontWeight: "700" },
});
