import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>MedTerm Study</Text>
        <Text style={styles.subtitle}>Learn medical terminology, one root at a time.</Text>

        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.primary]}
            onPress={() => navigation.navigate("Flashcards", {})}
          >
            <Text style={styles.buttonTextPrimary}>Study Flashcards</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => navigation.navigate("Quiz", {})}
          >
            <Text style={styles.buttonTextSecondary}>Take a Quiz</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => navigation.navigate("Categories")}
          >
            <Text style={styles.buttonTextSecondary}>Browse by Category</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 34, fontWeight: "800", color: "#0F766E", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  buttons: { gap: 14 },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primary: { backgroundColor: "#0F766E" },
  secondary: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#0F766E" },
  buttonTextPrimary: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  buttonTextSecondary: { color: "#0F766E", fontSize: 16, fontWeight: "700" },
});
