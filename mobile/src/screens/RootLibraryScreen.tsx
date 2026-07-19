import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { colors, partColor, radii, spacing, typography } from "../theme";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchRoots } from "../features/rootsSlice";
import type { PartType, RootEntry } from "../types/types";

const FILTERS: { key: PartType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "prefix", label: "Prefixes" },
  { key: "root", label: "Roots" },
  { key: "suffix", label: "Suffixes" },
];

export default function RootLibraryScreen() {
  const dispatch = useAppDispatch();
  const roots = useAppSelector((state) => state.roots.items);
  const rootsStatus = useAppSelector((state) => state.roots.status);
  const [filter, setFilter] = useState<PartType | "all">("all");
  const [query, setQuery] = useState("");
  const loading = rootsStatus === "loading";
  useEffect(() => {
    if (rootsStatus === "idle") {
      dispatch(fetchRoots());
    }
  }, [dispatch, rootsStatus]);

  const results = useMemo(() => {
    let data = roots;
    if (filter !== "all") data = data.filter((r) => r.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.meaning.toLowerCase().includes(q),
      );
    }
    return data;
  }, [filter, query, roots]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Root Library</Text>
        <Text style={styles.subtitle}>
          Learn the ~30 building blocks that unlock hundreds of terms — instead
          of memorizing words one at a time.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Search a root or meaning"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
        renderItem={({ item }) => <RootRow entry={item} />}
      />
    </View>
  );
}

function RootRow({ entry }: { entry: RootEntry }) {
  const tint = partColor(entry.type);
  return (
    <View style={[styles.rootRow, { borderLeftColor: tint }]}>
      <Text style={[styles.rootText, { color: tint }]}>{entry.text}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.rootMeaning}>{entry.meaning}</Text>
        <Text style={styles.metaTag}> {entry.mnemonicSeed}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaTag}>{entry.bodySystem}</Text>
      </View>
      <Text style={styles.metaTag}>
        {entry.examples.map((e) => `"${e.term}"`).join(", ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
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
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filterRow: { flexDirection: "row" },
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
  rootRow: {
    backgroundColor: colors.paperDim,
    borderRadius: radii.sm,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rootText: {
    ...typography.display,
    fontSize: 17,
  },
  rootMeaning: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    display: "flex",
    alignContent: "center",
    flexWrap: "nowrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  metaTag: {
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
