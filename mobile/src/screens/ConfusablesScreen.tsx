import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing, typography } from "../theme";
import { useAppDispatch, useAppSelector } from "../hooks";
import { fetchTerms } from "../features/termsSlice";
import { fetchConfusables } from "../features/confusablesSlice";
import ConfusablePairCard from "../components/ConfusablePairCard";
import { RootStackParamList } from "../types/types";

type Props = NativeStackScreenProps<RootStackParamList, "Confusables">;

export default function ConfusablesScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const terms = useAppSelector((state) => state.terms.items);
  const confusables = useAppSelector((state) => state.confusables.items);
  const termsStatus = useAppSelector((state) => state.terms.status);
  const confusablesStatus = useAppSelector((state) => state.confusables.status);

  useEffect(() => {
    if (termsStatus === "idle") {
      dispatch(fetchTerms());
    }
    if (confusablesStatus === "idle") {
      dispatch(fetchConfusables());
    }
  }, [dispatch, termsStatus, confusablesStatus]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>High-Risk Confusables</Text>
        <Text style={styles.subtitle}>
          These pairs look or sound almost identical but mean opposite — or completely
          unrelated — things. The highlighted letters are the whole difference.
        </Text>
      </View>
      <FlatList
        data={confusables}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        renderItem={({ item }) => {
          const termA = terms.find((term) => term.id === item.termAId);
          const termB = terms.find((term) => term.id === item.termBId);
          if (!termA || !termB) return null;
          return (
            <ConfusablePairCard
              pair={item}
              termA={termA}
              termB={termB}
              onPressTerm={(termId) => navigation.navigate("TermDetail", { termId })}
            />
          );
        }}
      />
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
    lineHeight: 18,
  },
});
