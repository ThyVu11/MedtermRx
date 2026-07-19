import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radii, spacing, typography } from "../theme";
import TermCard from "../components/TermCard";
import {
  CATEGORIES,
  Category,
  RootStackParamList,
  Term,
  TermSection,
} from "../types/types";
import { searchTerms } from "../api/terms";
import { useDebounce } from "../hooks/useDebounce";

type Props = NativeStackScreenProps<RootStackParamList, "Dissector">;

export const FILTERS = [
  {
    key: "all",
    label: "All",
  },
  ...CATEGORIES.map((category: Category) => ({
    key: category,
    label: category
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  })),
] as const;

const INITIAL_CATEGORY_COUNT = 1;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function DissectorScreen({ navigation, route }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState(route.params?.initialQuery ?? "");
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const sectionListRef = useRef<SectionList<Term, TermSection>>(null);
  const pendingSectionIndexRef = useRef<number | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const visibleCategories = showAllCategories
    ? FILTERS
    : FILTERS.slice(0, INITIAL_CATEGORY_COUNT);

  useEffect(() => {
    setLoading(true);

    searchTerms(debouncedQuery)
      .then((results) => {
        setTerms(results);
      })
      .catch(() => {
        setTerms([]);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedQuery]);

  const filteredTerms = useMemo(() => {
    if (filter === "all") {
      return terms;
    }

    return terms.filter((term) => term.category.includes(filter));
  }, [filter, terms]);

  const sections = useMemo<TermSection[]>(() => {
    const groups = new Map<string, Term[]>();

    const sortedTerms = [...filteredTerms].sort((a, b) =>
      a.word.localeCompare(b.word, undefined, {
        sensitivity: "base",
      }),
    );

    for (const term of sortedTerms) {
      const firstCharacter = term.word.trim().charAt(0).toUpperCase();

      const letter = /^[A-Z]$/.test(firstCharacter) ? firstCharacter : "#";

      const group = groups.get(letter) ?? [];

      group.push(term);
      groups.set(letter, group);
    }

    const orderedLetters = [...ALPHABET, "#"];

    return orderedLetters
      .filter((letter) => groups.has(letter))
      .map((letter) => ({
        title: letter,
        data: groups.get(letter) ?? [],
      }));
  }, [filteredTerms]);

  const scrollToLetter = (letter: string): void => {
    const sectionIndex = sections.findIndex(
      (section) => section.title === letter,
    );

    if (sectionIndex === -1) {
      return;
    }

    pendingSectionIndexRef.current = sectionIndex;

    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      animated: true,
      viewPosition: 0,
      viewOffset: 8,
    });
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Word Dissector</Text>
        <Text style={styles.subtitle}>
          Search any term to split it into prefix, root, suffix
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Try “cholecystectomy”"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* CATEGORY FILTERS */}
      <View style={styles.filterRow}>
        {FILTERS.length > INITIAL_CATEGORY_COUNT && (
          <TouchableOpacity
            style={[
              styles.categoryToggle,
              showAllCategories && styles.categoryToggleActive,
            ]}
            onPress={() => setShowAllCategories((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={
              showAllCategories ? "Collapse categories" : "Expand categories"
            }
          >
            <MaterialIcons
              name="category"
              size={18}
              color={showAllCategories ? colors.textOnBrand : colors.teal}
            />
          </TouchableOpacity>
        )}

        {visibleCategories.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterChip,
              filter === item.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(item.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item.key && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* REVIEW ACTIONS */}
      {filter !== "all" && (
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              navigation.navigate("Flashcard", {
                category: filter,
              })
            }
          >
            <Text style={styles.reviewButtonTitle}>🗂 Flashcards</Text>

            <Text style={styles.reviewButtonSubtitle}>
              Review this category
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              navigation.navigate("Quiz", {
                category: filter,
              })
            }
          >
            <Text style={styles.reviewButtonTitle}>📝 Quiz</Text>

            <Text style={styles.reviewButtonSubtitle}>Test your knowledge</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AlphabetRow */}
      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TermCard
              term={item}
              onPress={() =>
                navigation.navigate("TermDetail", {
                  termId: item.id,
                })
              }
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLetter}>{section.title}</Text>
            </View>
          )}
          onScrollToIndexFailed={(info) => {
            const targetSectionIndex = pendingSectionIndexRef.current;

            if (targetSectionIndex === null) {
              return;
            }

            sectionListRef.current?.getScrollResponder()?.scrollTo({
              y: info.averageItemLength * info.index,
              animated: false,
            });

            setTimeout(() => {
              sectionListRef.current?.scrollToLocation({
                sectionIndex: targetSectionIndex,
                itemIndex: 0,
                animated: true,
                viewPosition: 0,
                viewOffset: 8,
              });

              pendingSectionIndexRef.current = null;
            }, 150);
          }}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#0F766E" />
              </View>
            ) : (
              <Text style={styles.empty}>
                {query.trim()
                  ? `No terms match “${query}” yet — try a different spelling.`
                  : "No medical terms are available."}
              </Text>
            )
          }
          contentContainerStyle={[
            styles.listContent,
            sections.length === 0 && styles.emptyContainer,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled
          initialNumToRender={30}
          maxToRenderPerBatch={30}
          windowSize={15}
        />

        <View style={styles.alphabetSidebar}>
          {ALPHABET.map((letter) => {
            const available = sections.some(
              (section) => section.title === letter,
            );

            return (
              <TouchableOpacity
                key={letter}
                style={styles.letterButton}
                disabled={!available}
                onPress={() => scrollToLetter(letter)}
              >
                <Text
                  style={[
                    styles.letterText,
                    !available && styles.letterTextDisabled,
                  ]}
                >
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: {
    ...typography.display,
    fontSize: 24,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.textPrimary,
  },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: { flexGrow: 1 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.paperDim,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  filterTextActive: { color: colors.textOnBrand },
  // listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  alphabetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 6,
  },

  letterButtonDisabled: {
    opacity: 0.3,
  },

  sectionHeader: {
    backgroundColor: colors.paper,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  sectionLetter: {
    ...typography.display,
    fontSize: 20,
    color: colors.teal,
  },
  reviewActions: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },

  reviewButton: {
    flex: 1,
    backgroundColor: colors.paperDim,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },

  reviewButtonTitle: {
    ...typography.display,
    fontSize: 16,
    color: colors.teal,
  },

  reviewButtonSubtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContainer: {
    flex: 1,
  },
  alphabetSidebar: {
    position: "absolute",
    right: 2,
    top: 20,
    bottom: 20,

    justifyContent: "space-evenly",
    alignItems: "center",

    width: 24,
  },
  letterButton: {
    width: 20,
    height: 20,

    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.teal,
  },
  letterTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.3,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: 36,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "#F0FDFA",
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop:0
  },
  categoryToggle: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paperDim,
    borderWidth: 1,
    borderColor: colors.line,
  },

  categoryToggleActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
});
