import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radii, spacing, typography } from "@/theme";
import { loadDeck } from "@/utils/deckStorage";
import { dueCards } from "@/utils/spacedRepetition";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { fetchTerms } from "@/features/termsSlice";
import { fetchConfusables } from "@/features/confusablesSlice";
import type { RootStackParamList } from "@/types/types";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export default function DashboardScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const terms = useAppSelector((state) => state.terms.items);
  const termsStatus = useAppSelector((state) => state.terms.status);
  const confusables = useAppSelector((state) => state.confusables.items);
  const [deckSize, setDeckSize] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [mastered, setMastered] = useState(0);

  useEffect(() => {
    if (termsStatus === "idle") {
      dispatch(fetchTerms());
    }
    if (confusables.length === 0) {
      dispatch(fetchConfusables());
    }
  }, [confusables.length, dispatch, termsStatus]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDeck().then((deck) => {
        if (!active) return;
        setDeckSize(deck.length);
        setDueCount(dueCards(deck).length);
        setMastered(deck.filter((c) => c.repetitions >= 3).length);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MedTermRx</Text>
      <Text style={styles.title}>
        Dissect the language.{"\n"}Skip the burnout.
      </Text>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{dueCount}</Text>
          <Text style={styles.statLabel}>Due today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{deckSize}</Text>
          <Text style={styles.statLabel}>In your deck</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mastered}</Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryAction}
        onPress={() => navigation.navigate("Review")}
      >
        <Text style={styles.primaryActionText}>
          {dueCount > 0
            ? `Review ${dueCount} due card${dueCount === 1 ? "" : "s"}`
            : "Start a review session"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Study tools</Text>

      <View style={styles.grid}>
        <ToolCard
          label="Scan"
          desc="Point your camera at a textbook and dissect words instantly"
          onPress={() => navigation.navigate("Scanner")}
        />
        <ToolCard
          label="Dissector"
          desc="Search any term and see its prefix, root, and suffix"
          onPress={() => navigation.navigate("Dissector", {})}
        />
        <ToolCard
          label="Confusables"
          desc={`${confusables.length} high-risk sound-alike pairs to master`}
          onPress={() => navigation.navigate("Confusables")}
        />
        <ToolCard
          label="Root Library"
          desc="Browse every prefix, root, and suffix by body system"
          onPress={() => navigation.navigate("RootLibrary")}
        />

        <ToolCard
          label="Memory Map (anatomy)"
          desc="Search any term and see its prefix, root, and suffix"
          onPress={() => navigation.navigate("MemoryMap")}
        />
      </View>
      <Text style={styles.footerNote}>
        {terms.length} terms dissected and growing — every scan or search adds
        new ones to your library.
      </Text>
    </ScrollView>
  );
}

function ToolCard({
  label,
  desc,
  onPress,
}: {
  label: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.toolCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.toolLabel}>{label}</Text>
      <Text style={styles.toolDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.teal,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  statRow: { flexDirection: "row", marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  statNumber: {
    ...typography.display,
    fontSize: 26,
    color: colors.teal,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  primaryAction: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  primaryActionText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 15,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  toolCard: {
    width: "48%",
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 108,
  },
  toolLabel: {
    ...typography.display,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  toolDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
