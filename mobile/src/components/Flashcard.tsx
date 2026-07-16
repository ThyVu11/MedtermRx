import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Term } from "../types/types";

interface Props {
  term: Term;
}

export default function Flashcard({ term }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable
      style={styles.card}
      onPress={() => setRevealed((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel={revealed ? "Show term" : "Reveal definition"}
    >
      <Text style={styles.category}>{term.category}</Text>
      {!revealed ? (
        <>
          <Text style={styles.term}>{term.word}</Text>
          <Text style={styles.hint}>Tap to reveal definition</Text>
        </>
      ) : (
        <>
          <Text style={styles.definition}>{term.definition}</Text>
          {term.examples ? (
            <Text style={styles.example}>{term.examples}</Text>
          ) : null}
          <Text style={styles.hint}>Tap to go back</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 220,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  category: {
    position: "absolute",
    top: 16,
    left: 16,
    fontSize: 12,
    fontWeight: "600",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  term: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  definition: {
    fontSize: 20,
    fontWeight: "500",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  example: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#6B7280",
    textAlign: "center",
  },
  hint: {
    position: "absolute",
    bottom: 16,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
