import React from "react";

import { colors, radii, spacing, typography } from "../theme";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface ToolCardProps {
  label: string;
  desc: string;
  onPress: () => void;
}

export default function ToolCard({ label, desc, onPress }: ToolCardProps) {
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
});
