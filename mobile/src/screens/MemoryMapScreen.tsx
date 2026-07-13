import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AnatomicalCategory, RootStackParamList, Term } from "../types";
import {  searchTerms } from "../api/terms";
import { ORGAN_LOCATIONS } from "../data/organLocations";
import BodyDiagram from "@/components/BodyDiagram";
import { getMnemonicNotesFor } from "@/storage/mnemonics";

type Props = NativeStackScreenProps<RootStackParamList, "MemoryMap">;

export default function MemoryMapScreen({ navigation }: Props) {
  const [termsByCategory, setTermsByCategory] = useState<Record<string, Term[]>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    const entries = await Promise.all(
      ORGAN_LOCATIONS.map(async (organ) => {
        const terms =
          termsByCategory[organ.category] ?? (await searchTerms(organ.category));
        const notes = await getMnemonicNotesFor(terms.map((t) => t.id));
        const fraction = terms.length === 0 ? 0 : Object.keys(notes).length / terms.length;
        return [organ.category, terms, fraction] as const;
      })
    );

    const nextTerms: Record<string, Term[]> = {};
    const nextProgress: Record<string, number> = {};
    entries.forEach(([category, terms, fraction]) => {
      nextTerms[category] = terms;
      nextProgress[category] = fraction;
    });
    setTermsByCategory(nextTerms);
    setProgress(nextProgress);
    setLoading(false);
  }, [termsByCategory]);

  useEffect(() => {
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh completion state whenever the screen regains focus (e.g. after
  // adding a note on an organ's detail screen and coming back).
  useFocusEffect(
    useCallback(() => {
      loadProgress();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          Tap a body region to anchor its terms there. Write your own vivid image for each
          one — the weirder and more visual, the better it sticks.
        </Text>

        <BodyDiagram
          progressByCategory={progress}
          onSelectOrgan={(category: AnatomicalCategory) =>
            navigation.navigate("OrganDetail" as any, { category })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDFA" },
  container: { padding: 20, paddingBottom: 40 },
  intro: { fontSize: 14, color: "#4B5563", textAlign: "center", marginBottom: 16, lineHeight: 20 },
});
