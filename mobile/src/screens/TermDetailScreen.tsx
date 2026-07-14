import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radii, spacing, typography } from "@/theme";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { fetchTerms } from "@/features/termsSlice";
import { fetchConfusables } from "@/features/confusablesSlice";
import WordDissector from "@/components/WordDissector";
import { generateMnemonic } from "@/utils/mnemonicGenerator";
import { loadDeck, addTermToDeck } from "@/utils/deckStorage";
import { RootStackParamList } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "TermDetail">;

export default function TermDetailScreen({ route, navigation }: Props) {
  const dispatch = useAppDispatch();
  const { termId } = route.params;
  const terms = useAppSelector((state) => state.terms.items);
  const termsStatus = useAppSelector((state) => state.terms.status);
  const confusables = useAppSelector((state) => state.confusables.items);
  const confusablesStatus = useAppSelector((state) => state.confusables.status);
  const [inDeck, setInDeck] = useState(false);
  const term = terms.find((t) => t.id === termId);

  useEffect(() => {
    if (termsStatus === "idle") {
      dispatch(fetchTerms());
    }
    if (confusablesStatus === "idle") {
      dispatch(fetchConfusables());
    }
  }, [dispatch, termsStatus, confusablesStatus]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDeck().then((deck) => {
        if (active) setInDeck(deck.some((c) => c.termId === termId));
      });
      return () => {
        active = false;
      };
    }, [termId]),
  );

  if (!term) {
    return (
      <View style={styles.screen}>
        <Text style={styles.notFound}>Term not found.</Text>
      </View>
    );
  }

  const mnemonic = generateMnemonic(term);
  const relatedConfusables = confusables.filter(
    (c) => c.termAId === term.id || c.termBId === term.id,
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <WordDissector
        term={term}
        inDeck={inDeck}
        onAddToDeck={async () => {
          await addTermToDeck(term.id, "manual");
          setInDeck(true);
        }}
      />

      <View style={styles.mnemonicCard}>
        <Text style={styles.mnemonicEyebrow}>
          {mnemonic.generated
            ? "Auto-generated memory anchor"
            : "Memory anchor"}
        </Text>
        <Text style={styles.emojiStrip}>{mnemonic.emojiStrip}</Text>
        <Text style={styles.mnemonicScene}>{mnemonic.scene}</Text>
      </View>
      {relatedConfusables.length > 0 && (
        <View style={styles.confusableAlert}>
          <Text>Related Terms: {term.relatedTerms.join(", ")}</Text>
          <Text style={styles.confusableTitle}>⚠ Has a dangerous twin</Text>
          <Text style={styles.confusableBody}>
            This term is easy to confuse with a look-alike or sound-alike.
            Review the side-by-side comparison before your exam.
          </Text>

          <TouchableOpacity
            style={styles.confusableButton}
            onPress={() => navigation.navigate("Confusables")}
          >
            <Text style={styles.confusableButtonText}>See comparison →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  notFound: { padding: spacing.lg, color: colors.textSecondary },
  mnemonicCard: {
    backgroundColor: colors.warningBg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  mnemonicEyebrow: {
    ...typography.label,
    fontSize: 11,
    color: colors.prefix,
    marginBottom: spacing.sm,
  },
  emojiStrip: { fontSize: 24, marginBottom: spacing.sm },
  mnemonicScene: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  confusableAlert: {
    backgroundColor: colors.dangerBg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  confusableTitle: {
    ...typography.display,
    fontSize: 15,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  confusableBody: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  confusableButton: { alignSelf: "flex-start" },
  confusableButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
});
