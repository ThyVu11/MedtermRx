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
import { RootStackParamList, Term, WordPartCategory } from "../types/types";
import { searchTerms } from "../api/terms";
import MnemonicCard from "../components/MnemonicCard";

type Props = NativeStackScreenProps<RootStackParamList, "KeywordMnemonics">;

const WORD_PART_CATEGORIES: WordPartCategory[] = ["Prefix", "Suffix", "Root"];

export default function KeywordMnemonicScreen({ navigation }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WordPartCategory | "All">("All");

  useEffect(() => {
    Promise.all(WORD_PART_CATEGORIES.map((c) => searchTerms(c)))
      .then((results) => setTerms(results.flat()))
      .finally(() => setLoading(false));
  }, []);

  const visible =
    filter === "All" ? terms : terms.filter((t) => t.category === filter);

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (visible.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No terms in this filter.</Text>
      </View>
    );
  }

  const safeIndex = Math.min(index, visible.length - 1);
  const atStart = safeIndex === 0;
  const atEnd = safeIndex === visible.length - 1;

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.filters}>
          {(["All", ...WORD_PART_CATEGORIES] as const).map((f) => (
            <Pressable
              key={f}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.container}>
          <Text style={styles.progress}>
            {safeIndex + 1} / {visible.length}
          </Text>

          <MnemonicCard
            term={visible[safeIndex]}
            hint={visible[safeIndex].keywordHint}
            hintLabel="Keyword seed"
            key={visible[safeIndex].id}
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
              onPress={() =>
                setIndex((i) => Math.min(visible.length - 1, i + 1))
              }
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
  filters: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 0 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#0F766E",
  },
  filterChipActive: { backgroundColor: "#0F766E" },
  filterText: { color: "#0F766E", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#fff" },
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
