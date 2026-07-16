import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, CategorySummary } from "../types/types";
import { getCategories } from "../api/terms";

type Props = NativeStackScreenProps<RootStackParamList, "Categories">;

export default function CategoriesScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Couldn't load categories: {error}</Text>
        <Text style={styles.hint}>
          Check that the backend is running and reachable.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("TermList", { category: item.category })
            }
          >
            <Text style={styles.rowTitle}>{item.category}</Text>
            <Text style={styles.rowCount}>{item.count} terms</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
    padding: 24,
  },
  list: { padding: 16, gap: 10 },
  row: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },
  rowCount: { fontSize: 14, color: "#6B7280" },
  error: {
    color: "#B91C1C",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 6,
  },
  hint: { color: "#6B7280", textAlign: "center", fontSize: 13 },
});
