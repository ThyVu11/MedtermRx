import AsyncStorage from "@react-native-async-storage/async-storage";

// Personal mnemonic images live only on-device — this is the user's own
// self-generated imagery, which is what makes it memorable. No backend sync.
const KEY_PREFIX = "medterm:mnemonic:";

export async function getMnemonicNote(termId: string): Promise<string> {
  try {
    const value = await AsyncStorage.getItem(`${KEY_PREFIX}${termId}`);
    return value ?? "";
  } catch {
    return "";
  }
}

export async function saveMnemonicNote(termId: string, note: string): Promise<void> {
  try {
    if (note.trim().length === 0) {
      await AsyncStorage.removeItem(`${KEY_PREFIX}${termId}`);
    } else {
      await AsyncStorage.setItem(`${KEY_PREFIX}${termId}`, note);
    }
  } catch {
    // Best-effort — a failed local save shouldn't crash the study session.
  }
}

// Bulk-load notes for a list of term ids in one pass (used by list screens
// so every card can show a "✓ has note" indicator without N individual reads).
export async function getMnemonicNotesFor(termIds: string[]): Promise<Record<string, string>> {
  try {
    const pairs = await AsyncStorage.multiGet(termIds.map((id) => `${KEY_PREFIX}${id}`));
    const result: Record<string, string> = {};
    pairs.forEach(([key, value]) => {
      if (value) {
        const termId = key.replace(KEY_PREFIX, "");
        result[termId] = value;
      }
    });
    return result;
  } catch {
    return {};
  }
}
