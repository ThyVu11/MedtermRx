import React, { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radii, spacing, typography } from "@/theme";
import TermCard from "@/components/TermCard";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { CategoryType, Term } from "@/types";
import { searchTerms } from "@/api/terms";

type Props = NativeStackScreenProps<RootStackParamList, "Dissector">;

const FILTERS: { key: CategoryType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cardiovascular", label: "Cardiovascular" },
  { key: "urinary", label: "Urinary" },
  { key: "neurology", label: "Neurology" },
  { key: "respiratory", label: "Respiratory" },
  { key: "gastrointestinal", label: "Gastrointestinal" },
  { key: "musculoskeletal", label: "Musculoskeletal" },
  { key: "hematology", label: "Hematology" },
  { key: "sensory", label: "Sensory" }
];

export default function DissectorScreen({ navigation, route }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [filter, setFilter] = useState<CategoryType | "all">("all");
  const [query, setQuery] = useState(route.params?.initialQuery ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    searchTerms(query)
      .then((results) => {
        if (!active) return;
        setTerms(results);
      })
      .catch(() => {
        if (!active) return;
        setTerms([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  const results = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    const filtered = terms.filter((term) => {
      if (filter !== "all" && term.category !== filter) return false;
      if (!lowerQuery) return true;

      return (
        term.word.toLowerCase().includes(lowerQuery) ||
        term.searchTerms.some((value) => value.toLowerCase().includes(lowerQuery))
      );
    });

    return filtered;
  }, [filter, query, terms]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Dissector</Text>
        <Text style={styles.subtitle}>Search any term to split it into prefix, root, suffix</Text>
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
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

       <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TermCard term={item} onPress={() =>  navigation.navigate("TermDetail", { termId: item.id })} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No terms match “{query}” yet — try a different spelling.</Text>
        }
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
      />
      

      {/* <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TermCard term={item} onPress={() =>  navigation.navigate("TermDetail", { termId: item.id })} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No terms match “{query}” yet — try a different spelling.</Text>
        }
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
      /> */}
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
  chipRow: { 
    flexDirection: "row", 
    padding: spacing.lg, 
    paddingBottom: spacing.md,
    display: "flex",
    flexWrap: "wrap",
    gap: spacing.sm,
   },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.paperDim,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  filterTextActive: { color: colors.textOnBrand },
});
