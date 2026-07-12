import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MedicalTerm } from "../types";
import { getRandomTerms } from "../api/terms";
import Flashcard from "../components/Flashcard";

type Props = NativeStackScreenProps<RootStackParamList, "Flashcards">;

export default function FlashcardScreen({ route }: Props) {
  const category = route.params?.category;
  const [cards, setCards] = useState<MedicalTerm[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRandomTerms(15, category)
      .then(setCards)
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No cards available.</Text>
      </SafeAreaView>
    );
  }

  const atEnd = index === cards.length - 1;
  const atStart = index === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.progress}>
          {index + 1} / {cards.length}
        </Text>

        <Flashcard term={cards[index]} key={cards[index].id} />

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
            onPress={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
          >
            <Text style={styles.navText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDFA" },
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 20 },
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
