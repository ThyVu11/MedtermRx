import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { colors, radii, spacing, typography } from "@/theme";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { fetchTerms } from "@/features/termsSlice";
import { fetchConfusables } from "@/features/confusablesSlice";
import { fetchRoots } from "@/features/rootsSlice";
import { loadDeck, updateCard } from "@/utils/deckStorage";
import { dueCards, scheduleNextReview } from "@/utils/spacedRepetition";
import type { DeckCard, ReviewQuality, Term } from "@/types/types";

type Mode = "spelling" | "root_recall" | "confusable";

interface Question {
  card: DeckCard;
  term: Term;
  mode: Mode;
}

function pickMode(
  term: Term,
  index: number,
  confusables: readonly { termAId: string; termBId: string }[],
): Mode {
  const hasConfusable = confusables.some(
    (c) => c.termAId === term.id || c.termBId === term.id,
  );
  if (hasConfusable && index % 3 === 0) return "confusable";
  return index % 2 === 0 ? "spelling" : "root_recall";
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function ReviewScreen() {
  const dispatch = useAppDispatch();
  const terms = useAppSelector((state) => state.terms.items);
  const roots = useAppSelector((state) => state.roots.items);
  const confusables = useAppSelector((state) => state.confusables.items);
  const [queue, setQueue] = useState<Question[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [spellingInput, setSpellingInput] = useState("");
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (terms.length === 0) {
      dispatch(fetchTerms());
    }
    if (roots.length === 0) {
      dispatch(fetchRoots());
    }
    if (confusables.length === 0) {
      dispatch(fetchConfusables());
    }
  }, [dispatch, terms.length, roots.length, confusables.length]);

  useEffect(() => {
    if (terms.length === 0 || confusables.length === 0) return;

    loadDeck().then((deck) => {
      const due = dueCards(deck);
      const qs: Question[] = due
        .map((card, i) => {
          const term = terms.find((t) => t.id === card.termId);
          if (!term) return null;
          return { card, term, mode: pickMode(term, i, confusables) };
        })
        .filter((q): q is Question => q !== null);
      setQueue(qs);
    });
  }, [terms, confusables]);

  const question = queue && queue.length > 0 ? queue[current] : null;

  const rootChoices = useMemo(() => {
    if (!question || question.mode !== "root_recall") return [];
    const targetPart = question.term.parts[0];
    const distractors = shuffle(
      roots.filter((r) => r.meaning !== targetPart.meaning),
    )
      .slice(0, 3)
      .map((r) => r.meaning);
    return shuffle([targetPart.meaning, ...distractors]);
  }, [question, roots]);

  const confusablePair = useMemo(() => {
    if (!question || question.mode !== "confusable") return null;
    return (
      confusables.find(
        (c) => c.termAId === question.term.id || c.termBId === question.term.id,
      ) ?? null
    );
  }, [question, confusables]);

  if (!queue) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loading}>Loading your due cards…</Text>
      </View>
    );
  }

  if (queue.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>Nothing due right now 🎉</Text>
          <Text style={styles.doneBody}>
            Add more terms from the Dissector, Scanner, or Root Library, and
            they'll show up here when they're ready to review.
          </Text>
        </View>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.screen}>
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>Session complete ✅</Text>
          <Text style={styles.doneBody}>
            You reviewed every due card. Nice work.
          </Text>
        </View>
      </View>
    );
  }

  const rate = async (quality: ReviewQuality) => {
    const updated = scheduleNextReview(question.card, quality);
    await updateCard(updated);
    setRevealed(false);
    setSpellingInput("");
    setWasCorrect(null);
    setCurrent((c) => c + 1);
  };

  const checkSpelling = () => {
    const correct =
      spellingInput.trim().toLowerCase() === question.term.word.toLowerCase();
    setWasCorrect(correct);
    setRevealed(true);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text style={styles.progress}>
        Card {current + 1} of {queue.length}
      </Text>

      {question.mode === "spelling" && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Spelling drill</Text>
          <Text style={styles.prompt}>{question.term.definition}</Text>
          <Text style={styles.pronunciationHint}>
            /{question.term.pronunciation}/
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Type the term"
            placeholderTextColor={colors.textSecondary}
            value={spellingInput}
            onChangeText={setSpellingInput}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!revealed}
          />
          {!revealed ? (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={checkSpelling}
            >
              <Text style={styles.checkButtonText}>Check</Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.resultBox,
                wasCorrect ? styles.resultBoxCorrect : styles.resultBoxWrong,
              ]}
            >
              <Text style={styles.resultText}>
                {wasCorrect
                  ? "Correct!"
                  : `Correct spelling: ${question.term.word}`}
              </Text>
            </View>
          )}
        </View>
      )}

      {question.mode === "root_recall" && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Root recall</Text>
          <Text style={styles.prompt}>
            What does “{question.term.parts[0].text}” mean in{" "}
            {question.term.word}?
          </Text>
          <View style={styles.choices}>
            {rootChoices.map((choice) => {
              const isTarget = choice === question.term.parts[0].meaning;
              const showFeedback = revealed;
              return (
                <TouchableOpacity
                  key={choice}
                  style={[
                    styles.choiceButton,
                    showFeedback && isTarget && styles.choiceCorrect,
                    showFeedback && !isTarget && styles.choiceMuted,
                  ]}
                  disabled={revealed}
                  onPress={() => {
                    setWasCorrect(isTarget);
                    setRevealed(true);
                  }}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {question.mode === "confusable" && confusablePair && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Confusable check</Text>
          <Text style={styles.prompt}>
            Which term means: “{question.term.definition}”?
          </Text>
          <View style={styles.choices}>
            {[confusablePair.termAId, confusablePair.termBId].map((id) => {
              const t = terms.find((termItem) => termItem.id === id);
              if (!t) return null;
              const isTarget = t.id === question.term.id;
              const showFeedback = revealed;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.choiceButton,
                    showFeedback && isTarget && styles.choiceCorrect,
                    showFeedback && !isTarget && styles.choiceMuted,
                  ]}
                  disabled={revealed}
                  onPress={() => {
                    setWasCorrect(isTarget);
                    setRevealed(true);
                  }}
                >
                  <Text style={styles.choiceText}>{t.word}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {revealed && (
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>How well did you know it?</Text>
          <View style={styles.rateButtons}>
            <RateButton label="Again" onPress={() => rate(1)} tone="danger" />
            <RateButton label="Hard" onPress={() => rate(3)} tone="neutral" />
            <RateButton label="Good" onPress={() => rate(4)} tone="brand" />
            <RateButton label="Easy" onPress={() => rate(5)} tone="success" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function RateButton({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone: "danger" | "neutral" | "brand" | "success";
}) {
  const bg = {
    danger: colors.danger,
    neutral: colors.line,
    brand: colors.teal,
    success: colors.success,
  }[tone];
  return (
    <TouchableOpacity
      style={[styles.rateButton, { backgroundColor: bg }]}
      onPress={onPress}
    >
      <Text style={styles.rateButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  loading: { padding: spacing.lg, color: colors.textSecondary },
  progress: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    fontSize: 11,
    color: colors.teal,
    marginBottom: spacing.sm,
  },
  prompt: {
    ...typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  pronunciationHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  checkButton: {
    marginTop: spacing.md,
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  checkButtonText: { color: colors.textOnBrand, fontWeight: "700" },
  resultBox: {
    marginTop: spacing.md,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  resultBoxCorrect: { backgroundColor: colors.successBg },
  resultBoxWrong: { backgroundColor: colors.dangerBg },
  resultText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  choices: { marginTop: spacing.sm },
  choiceButton: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  choiceCorrect: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  choiceMuted: { opacity: 0.5 },
  choiceText: { fontSize: 14, color: colors.textPrimary },
  rateRow: { marginTop: spacing.lg },
  rateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rateButtons: { flexDirection: "row", justifyContent: "space-between" },
  rateButton: {
    flex: 1,
    marginRight: spacing.xs,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  rateButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 12,
  },
  doneCard: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    alignItems: "center",
  },
  doneTitle: {
    ...typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  doneBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
