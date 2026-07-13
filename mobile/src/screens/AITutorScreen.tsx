import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  askAITutor,
  type TutorMode,
} from "@/api/aiTutor";
import {
  colors,
  radii,
  spacing,
  typography,
} from "@/theme";
import type {
  RootStackParamList,
} from "@/types";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "AITutor"
>;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS: {
  mode: TutorMode;
  label: string;
  prompt: string;
}[] = [
  {
    mode: "simple",
    label: "Explain simply",
    prompt: "Explain this term simply.",
  },
  {
    mode: "mnemonic",
    label: "Mnemonic",
    prompt: "Create a mnemonic.",
  },
  {
    mode: "clinical_example",
    label: "Clinical example",
    prompt: "Give me a clinical example.",
  },
  {
    mode: "compare",
    label: "Compare",
    prompt: "Compare it with related terms.",
  },
  {
    mode: "quiz",
    label: "Quiz me",
    prompt: "Quiz me on this term.",
  },
];

export default function AITutorScreen({
  route,
}: Props) {
  const { termId } = route.params;

  const listRef =
    useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [previousResponseId, setPreviousResponseId] =
    useState<string | undefined>();
    
 const initialRequestSentRef = useRef(false);

  const sendRequest = useCallback(
    async (
      mode: TutorMode,
      userText: string,
    ): Promise<void> => {
      if (loading) {
        return;
      }

      setLoading(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      setMessages((current) => [
        ...current,
        userMessage,
      ]);

      try {
        const result = await askAITutor({
          termId,
          mode,
          message:
            mode === "chat"
              ? userText
              : undefined,
          previousResponseId,
        });

        setPreviousResponseId(
          result.responseId,
        );

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.answer,
        };

        setMessages((current) => [
          ...current,
          assistantMessage,
        ]);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "AI Tutor request failed.";

        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      previousResponseId,
      termId,
    ],
  );

  useEffect(() => {
    if (initialRequestSentRef.current) {
    return;
  }
    initialRequestSentRef.current = true;

    void sendRequest(
      "simple",
      "Explain this term simply.",
    );
  
  }, [sendRequest]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, [messages]);

  const submitQuestion = (): void => {
    const question = input.trim();

    if (!question || loading) {
      return;
    }

    setInput("");

    void sendRequest("chat", question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          AI Tutor
        </Text>

        <Text style={styles.subtitle}>
          Ask questions about this medical term.
        </Text>
      </View>

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.mode}
            style={({ pressed }) => [
              styles.actionChip,
              pressed &&
                styles.actionChipPressed,
            ]}
            disabled={loading}
            onPress={() =>
              void sendRequest(
                action.mode,
                action.prompt,
              )
            }
          >
            <Text style={styles.actionText}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          styles.messageList
        }
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === "user"
                ? styles.userBubble
                : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.role === "user" &&
                  styles.userMessageText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <>
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  size="small"
                  color={colors.teal}
                />

                <Text style={styles.loadingText}>
                  RootRx is thinking...
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}
          </>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a follow-up question..."
          placeholderTextColor={
            colors.textSecondary
          }
          multiline
          maxLength={800}
          editable={!loading}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() || loading) &&
              styles.sendButtonDisabled,
          ]}
          disabled={
            !input.trim() || loading
          }
          onPress={submitQuestion}
        >
          <Text style={styles.sendButtonText}>
            Send
          </Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>
        Educational information only. Not medical
        advice.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  },

  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  actionChip: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paper,
  },

  actionChipPressed: {
    opacity: 0.7,
  },

  actionText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "700",
  },

  messageList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  messageBubble: {
    maxWidth: "88%",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.teal,
  },

  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.paperDim,
    borderWidth: 1,
    borderColor: colors.line,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },

  userMessageText: {
    color: colors.textOnBrand,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  errorCard: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#E8B5B5",
    borderRadius: radii.md,
    padding: spacing.md,
  },

  errorText: {
    color: "#8B2525",
    fontSize: 13,
    lineHeight: 18,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.paperDim,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    textAlignVertical: "top",
  },

  sendButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  sendButtonText: {
    color: colors.textOnBrand,
    fontWeight: "700",
  },

  disclaimer: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 10,
    paddingVertical: spacing.sm,
  },
});