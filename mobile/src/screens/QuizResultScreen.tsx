import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "QuizResult">;

export default function QuizResultScreen({ route, navigation }: Props) {
  const { score, total } = route.params;
  const percent = Math.round((score / total) * 100);

  let message = "Keep practicing!";
  if (percent >= 90) message = "Excellent work!";
  else if (percent >= 70) message = "Nice job!";
  else if (percent >= 50) message = "Good effort — review the ones you missed.";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.scoreText}>
          {score} / {total}
        </Text>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.primary]}
            onPress={() => navigation.navigate("Quiz", {})}
          >
            <Text style={styles.buttonTextPrimary}>Try another quiz</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.buttonTextSecondary}>Back to home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDFA" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 6 },
  scoreText: { fontSize: 48, fontWeight: "800", color: "#0F766E" },
  percent: { fontSize: 20, color: "#374151", marginBottom: 8 },
  message: { fontSize: 16, color: "#4B5563", marginBottom: 40 },
  buttons: { width: "100%", gap: 12 },
  button: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  primary: { backgroundColor: "#0F766E" },
  secondary: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#0F766E" },
  buttonTextPrimary: { color: "#fff", fontWeight: "700", fontSize: 16 },
  buttonTextSecondary: { color: "#0F766E", fontWeight: "700", fontSize: 16 },
});
