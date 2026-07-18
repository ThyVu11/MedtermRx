import type { DeckCard, Term } from "../types/types";

export const BASE_URL = "http://localhost:3000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`RootRx API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  scanText: (text: string) =>
    request<{ matches: Term[] }>("/terms/scan", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  fetchDeck: (userId: string) => request<DeckCard[]>(`/progress/${userId}`),
  syncDeck: (userId: string, deck: DeckCard[]) =>
    request<{ ok: boolean; count: number }>(`/progress/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ deck }),
    }),
};
