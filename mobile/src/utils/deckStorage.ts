import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DeckCard } from "../types/types";
import { newCard } from "./spacedRepetition";

const DECK_KEY = "rootrx:deck:v1";

export async function loadDeck(): Promise<DeckCard[]> {
  try {
    const raw = await AsyncStorage.getItem(DECK_KEY);
    return raw ? (JSON.parse(raw) as DeckCard[]) : [];
  } catch (err) {
    console.warn("RootRx: failed to load deck from storage", err);
    return [];
  }
}

export async function saveDeck(deck: DeckCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DECK_KEY, JSON.stringify(deck));
  } catch (err) {
    console.warn("RootRx: failed to save deck to storage", err);
  }
}

export async function addTermToDeck(
  termId: string,
  addedFrom: DeckCard["addedFrom"],
): Promise<DeckCard[]> {
  const deck = await loadDeck();
  if (deck.some((c) => c.termId === termId)) return deck;
  const updated = [...deck, newCard(termId, addedFrom)];
  await saveDeck(updated);
  return updated;
}

export async function updateCard(updatedCard: DeckCard): Promise<DeckCard[]> {
  const deck = await loadDeck();
  const updated = deck.map((c) =>
    c.termId === updatedCard.termId ? updatedCard : c,
  );
  await saveDeck(updated);
  return updated;
}

export async function removeFromDeck(termId: string): Promise<DeckCard[]> {
  const deck = await loadDeck();
  const updated = deck.filter((c) => c.termId !== termId);
  await saveDeck(updated);
  return updated;
}
