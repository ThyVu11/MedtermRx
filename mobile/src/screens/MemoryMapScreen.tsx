import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { Category, RootStackParamList, Term } from "../types/types";
import { searchTerms } from "../api/terms";
import { ORGAN_LOCATIONS } from "../data/organLocations";
import { getMnemonicNotesFor } from "../storage/mnemonics";
import BodyDiagram from "../components/BodyDiagram";

type Props = NativeStackScreenProps<RootStackParamList, "MemoryMap">;

export default function MemoryMapScreen({ navigation }: Props) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Cache terms without causing loadProgress to be recreated.
  const termsCacheRef = useRef<Record<string, Term[]>>({});

  const loadCategoryProgress = useCallback(
    async (category: string): Promise<void> => {
      try {
        let terms = termsCacheRef.current[category];

        if (!terms) {
          terms = await searchTerms(category);
          termsCacheRef.current[category] = terms;
        }

        const notes = await getMnemonicNotesFor(terms.map((term) => term.id));

        const fraction =
          terms.length === 0 ? 0 : Object.keys(notes).length / terms.length;

        // Update one category as soon as it is ready.
        setProgress((current) => ({
          ...current,
          [category]: fraction,
        }));
      } catch (error) {
        console.error(`Failed to load progress for ${category}:`, error);

        setProgress((current) => ({
          ...current,
          [category]: 0,
        }));
      }
    },
    [],
  );

  const loadProgress = useCallback(async (): Promise<void> => {
    setLoadingProgress(true);

    try {
      const uniqueCategories = Array.from(
        new Set(ORGAN_LOCATIONS.map((organ) => organ.category)),
      );

      // Load categories progressively instead of blocking on Promise.all.
      for (const category of uniqueCategories) {
        await loadCategoryProgress(category);
      }
    } finally {
      setLoadingProgress(false);
    }
  }, [loadCategoryProgress]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      // Let the screen and navigation animation render first.
      const task = InteractionManager.runAfterInteractions(() => {
        if (!cancelled) {
          void loadProgress();
        }
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [loadProgress]),
  );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          Tap a body region to anchor its terms there. Write your own vivid
          image for each one — the weirder and more visual, the better it
          sticks.
        </Text>

        {loadingProgress && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.loadingText}>Updating your progress...</Text>
          </View>
        )}

        <BodyDiagram
          progressByCategory={progress}
          onSelectOrgan={(category: Category) => {
            navigation.navigate("OrganDetail", { category });
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F0FDFA",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#4B5563",
  },
});
