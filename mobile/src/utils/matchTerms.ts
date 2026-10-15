import type { Term } from "../types/types";

export function matchTermsInText(terms: Term[], rawText: string): Term[] {
  const words = rawText.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

  const searchWords = [...new Set(words)].filter((word) => word.length >= 4);

  return terms.filter((term) =>
    searchWords.some((word) => term.word.toLowerCase().includes(word)),
  );
}
