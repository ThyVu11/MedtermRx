import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import Flashcard from "@/components/Flashcard";
import { getRandomTerms } from "@/api/terms";
import {
  colors,
  radii,
  spacing,
  typography,
} from "@/theme";
import type {
  RootStackParamList,
  Term,
} from "@/types";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Flashcard"
>;

export default function FlashcardScreen({
  route,
}: Props) {
  const category = route.params?.category;

  const [cards, setCards] = useState<Term[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIndex(0);

    try {
      const results = await getRandomTerms(
        category,
      );

      setCards(results);
    } catch (loadError) {
      console.error(
        "Failed to load flashcards:",
        loadError,
      );

      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load flashcards.";

      setCards([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const goPrevious = (): void => {
    setIndex((currentIndex) =>
      Math.max(0, currentIndex - 1),
    );
  };

  const goNext = (): void => {
    setIndex((currentIndex) =>
      Math.min(
        cards.length - 1,
        currentIndex + 1,
      ),
    );
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.teal}
          />

          <Text style={styles.statusText}>
            Preparing your review deck...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              Unable to load flashcards
            </Text>

            <Text style={styles.messageText}>
              {error}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => void loadCards()}
            >
              <Text style={styles.primaryButtonText}>
                Try again
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              No cards available
            </Text>

            <Text style={styles.messageText}>
              {category
                ? `There are no flashcards available for ${category}.`
                : "There are no flashcards available yet."}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => void loadCards()}
            >
              <Text style={styles.primaryButtonText}>
                Refresh deck
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const currentCard = cards[index];
  const atStart = index === 0;
  const atEnd = index === cards.length - 1;
  const progress = (index + 1) / cards.length;

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Review Deck
          </Text>

          <Text style={styles.subtitle}>
            {category
              ? `${category} flashcards`
              : "Mixed medical terminology"}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Card {index + 1} of {cards.length}
            </Text>

            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Flashcard
            key={currentCard.id}
            term={currentCard}
          />
        </View>

        <View style={styles.navigation}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              atStart &&
                styles.buttonDisabled,
              pressed &&
                !atStart &&
                styles.buttonPressed,
            ]}
            disabled={atStart}
            onPress={goPrevious}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                atStart &&
                  styles.buttonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </Pressable>

          {atEnd ? (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.navigationButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() => void loadCards()}
            >
              <Text style={styles.primaryButtonText}>
                New deck
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.navigationButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={goNext}
            >
              <Text style={styles.primaryButtonText}>
                Next
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },

  container: {
    flex: 1,
    padding: spacing.lg,
  },

  header: {
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.display,
    fontSize: 24,
    color: colors.ink,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },

  statusText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 13,
  },

  progressSection: {
    marginBottom: spacing.lg,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  progressPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
  },

  progressTrack: {
    height: 7,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.paperDim,
  },

  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.teal,
  },

  cardContainer: {
    flex: 1,
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  navigation: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  navigationButton: {
    flex: 1,
  },

  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
    fontSize: 14,
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },

  secondaryButtonText: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: 14,
  },

  buttonDisabled: {
    borderColor: colors.line,
    backgroundColor: colors.paperDim,
  },

  buttonTextDisabled: {
    color: colors.textSecondary,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  messageCard: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperDim,
  },

  messageTitle: {
    ...typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});