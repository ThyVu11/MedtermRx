import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Keyboard } from "react-native";
import { getMnemonicNote, saveMnemonicNote } from "../storage/mnemonics";
import { Term } from "@/types";

interface Props {
  term: Term;
  hint?: string; // keywordHint or an anatomical prompt, whichever applies
  hintLabel?: string;
}

export default function MnemonicCard({ term, hint, hintLabel = "Mnemonic seed" }: Props) {
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    getMnemonicNote(term.id).then((value) => {
      setNote(value);
      setLoaded(true);
    });
  }, [term.id]);

  const handleBlur = useCallback(() => {
    saveMnemonicNote(term.id, note);
  }, [term.id, note]);

  return (
    <View style={styles.card}>
      <Text style={styles.term}>{term.word}</Text>
      <Text style={styles.definition}>{term.definition}</Text>

      {hint ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintLabel}>{hintLabel}</Text>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}

      <Text style={styles.inputLabel}>Your image (describe it vividly — your own words stick best)</Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder="e.g. A hippo sinking below the river's surface..."
        placeholderTextColor="#9CA3AF"
        value={note}
        onChangeText={setNote}
        onBlur={handleBlur}
        onSubmitEditing={() => Keyboard.dismiss()}
        editable={loaded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  term: { fontSize: 26, fontWeight: "800", color: "#111827" },
  definition: { fontSize: 15, color: "#374151", marginTop: 4, marginBottom: 14 },
  hintBox: {
    backgroundColor: "#F0FDFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  hintText: { fontSize: 14, color: "#134E4A", lineHeight: 20 },
  inputLabel: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
  },
});
