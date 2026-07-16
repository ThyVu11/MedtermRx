import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { ConfusablePair, Term } from "@/types/types";
import { colors, radii, spacing, typography } from "@/theme";

interface Props {
  pair: ConfusablePair;
  termA: Term;
  termB: Term;
  onPressTerm?: (termId: string) => void;
}

function HighlightedWord({ word, diff }: { word: string; diff: string }) {
  const idx = word.toLowerCase().indexOf(diff.toLowerCase());
  if (idx === -1) return <Text style={styles.word}>{word}</Text>;
  const before = word.slice(0, idx);
  const match = word.slice(idx, idx + diff.length);
  const after = word.slice(idx + diff.length);
  return (
    <Text style={styles.word}>
      {before}
      <Text style={styles.diffHighlight}>{match}</Text>
      {after}
    </Text>
  );
}

export default function ConfusablePairCard({
  pair,
  termA,
  termB,
  onPressTerm,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>⚠ HIGH-RISK CONFUSABLE PAIR</Text>
      </View>

      <View style={styles.splitRow}>
        <TouchableOpacity
          style={styles.half}
          onPress={() => onPressTerm?.(termA.id)}
          activeOpacity={0.7}
        >
          <HighlightedWord word={termA.word} diff={pair.diffHighlight.a} />
          <Text style={styles.def}>{termA.definition}</Text>
        </TouchableOpacity>

        <View style={styles.vsCol}>
          <Text style={styles.vs}>vs</Text>
        </View>

        <TouchableOpacity
          style={styles.half}
          onPress={() => onPressTerm?.(termB.id)}
          activeOpacity={0.7}
        >
          <HighlightedWord word={termB.word} diff={pair.diffHighlight.b} />
          <Text style={styles.def}>{termB.definition}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.riskBox}>
        <Text style={styles.riskLabel}>Why it matters</Text>
        <Text style={styles.riskNote}>{pair.riskNote}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeRow: { marginBottom: spacing.sm },
  badge: {
    ...typography.label,
    fontSize: 11,
    color: colors.danger,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  half: {
    flex: 1,
    padding: spacing.sm,
  },
  vsCol: {
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  vs: {
    color: colors.textSecondary,
    fontStyle: "italic",
    fontSize: 12,
  },
  word: {
    ...typography.display,
    fontSize: 19,
    color: colors.ink,
  },
  diffHighlight: {
    color: colors.danger,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  def: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  riskBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  riskLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.danger,
    marginBottom: 2,
  },
  riskNote: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
});
