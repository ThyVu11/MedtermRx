import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { Term } from "../types/types";
import { colors, radii, spacing, typography } from "../theme";
import PartTag from "./PartTag";

interface Props {
  term: Term;
  onAddToDeck?: () => void;
  inDeck?: boolean;
}

export default function WordDissector({ term, onAddToDeck, inDeck }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Specimen</Text>
        <Text style={styles.word}>{term.word}</Text>
        <Text style={styles.pronunciation}>
          {term.pronunciation !== "" ? `/${term.pronunciation}/` : ""}
        </Text>
      </View>

      <View style={styles.partsRow}>
        {term.parts.map((part, idx) => (
          <PartTag key={`${term.id}-${idx}`} part={part} />
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.defLabel}>Definition</Text>
      <Text style={styles.definition}>{term.definition}</Text>
      <Text style={styles.plainDefinition}>{term.plainDefinition}</Text>

      {term.relatedTerms?.length > 0 && (
        <>
          <Text style={styles.metaLabel}>Related terms</Text>
          <Text style={styles.metaText}>{term.relatedTerms.join(", ")}</Text>
        </>
      )}

      {term.mnemonicSeed ? (
        <>
          <Text style={styles.metaLabel}>Mnemonic</Text>
          <Text style={styles.metaText}>{term.mnemonicSeed}</Text>
        </>
      ) : null}

      {onAddToDeck && (
        <TouchableOpacity
          style={[styles.addButton, inDeck && styles.addButtonDone]}
          onPress={onAddToDeck}
          disabled={inDeck}
        >
          <Text
            style={[styles.addButtonText, inDeck && styles.addButtonTextDone]}
          >
            {inDeck ? "✓ In your review deck" : "+ Add to review deck"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: { marginBottom: spacing.md },
  eyebrow: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  word: {
    ...typography.display,
    fontSize: 28,
    color: colors.ink,
  },
  pronunciation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  partsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  defLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  definition: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    backgroundColor: colors.paper,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  plainDefinition: {
    fontSize: 12,
    padding: spacing.sm,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  metaLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    backgroundColor: colors.paper,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  addButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  addButtonDone: {
    backgroundColor: colors.successBg,
  },
  addButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 14,
  },
  addButtonTextDone: {
    color: colors.success,
  },
});
