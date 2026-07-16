import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, QuizQuestion } from "../types/types";
import { getQuiz } from "../api/terms";
type Props = NativeStackScreenProps<RootStackParamList, "Quiz">;

export default function QuizScreen({ route, navigation }: Props) {
  const category = route.params?.category;
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuiz(category)
      .then(setQuestions)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const current = questions[index];

  function handleAnswer(choice: string) {
    if (selected) return; // lock after first pick
    setSelected(choice);
    if (choice === current.correctAnswer) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (index === questions.length - 1 && category) {
      navigation.replace("QuizResult", {
        score,
        total: questions.length,
        category,
      });
    } else {
      setSelected(null);
      setIndex((i) => i + 1);
    }
  }

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.progress}>
          Question {index + 1} / {questions.length}
        </Text>
        <Text style={styles.question}>What does "{current.term}" mean?</Text>

        <View style={styles.choices}>
          {current.choices.map((choice: string) => {
            if (typeof choice !== "string") return null;
            const isSelected = selected === choice;
            const isCorrect = choice === current.correctAnswer;
            const showState = selected !== null;

            return (
              <Pressable
                key={choice}
                style={[
                  styles.choice,
                  showState && isCorrect && styles.choiceCorrect,
                  showState && isSelected && !isCorrect && styles.choiceWrong,
                ]}
                onPress={() => handleAnswer(choice)}
              >
                <Text style={styles.choiceText}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {index === questions.length - 1 ? "See results" : "Next question"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
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
  container: { flex: 1, padding: 20, gap: 20 },
  progress: { textAlign: "center", color: "#6B7280", fontWeight: "600" },
  question: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  choices: { gap: 10 },
  choice: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 16,
    borderRadius: 12,
  },
  choiceCorrect: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  choiceWrong: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  choiceText: { fontSize: 15, color: "#111827" },
  nextButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#B91C1C", textAlign: "center" },
});
