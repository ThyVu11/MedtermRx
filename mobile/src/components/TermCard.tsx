import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import type { Term } from "@/types/types";
import { colors, partColor, radii, spacing, typography } from "@/theme";

interface Props {
  term: Term;
  onPress: () => void;
}

export default function TermCard({ term, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dotStack}>
        {term.parts.map((p, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: partColor(p.type) }]}
          />
        ))}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.word}>{term.word}</Text>
        <Text style={styles.def} numberOfLines={1}>
          {term.definition}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dotStack: {
    width: 20,
    marginRight: spacing.md,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginVertical: 1.5,
  },
  textCol: { flex: 1 },
  word: {
    ...typography.display,
    fontSize: 17,
    color: colors.ink,
  },
  def: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.line,
    marginLeft: spacing.sm,
  },
});
