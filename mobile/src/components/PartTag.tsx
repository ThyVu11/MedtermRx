import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { WordPart } from "../types/types";
import { colors, partColor, radii, spacing, typography } from "../theme";

interface Props {
  part: WordPart;
  compact?: boolean;
}

const LABELS: Record<string, string> = {
  prefix: "Prefix",
  root: "Root",
  suffix: "Suffix",
  combining_vowel: "Vowel",
  abbreviations_acronyms: "Abbreviations & Acronyms"
};

export default function PartTag({ part, compact }: Props) {
  const tint = partColor(part.type);
  return (
    <View
      style={[
        styles.wrap,
        { borderColor: tint },
        compact && styles.wrapCompact,
      ]}
    >
      <View style={[styles.pin, { backgroundColor: tint }]} />
      <View style={styles.textCol}>
        <Text style={[styles.partText, { color: tint }]}>{part.text}</Text>
        <Text style={styles.label}>{LABELS[part.type] ?? part.type}</Text>
        {!compact && <Text style={styles.meaning}>{part.meaning}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderRadius: radii.tag,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 96,
  },
  wrapCompact: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 0,
  },
  pin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: spacing.sm,
  },
  textCol: { flexShrink: 1 },
  partText: {
    fontSize: 16,
    // fontWeight: "700",
    ...typography.display,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  meaning: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 4,
  },
});
