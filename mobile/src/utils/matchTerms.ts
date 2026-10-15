import type { Term } from "../types/types";

export function matchTermsInText(terms: Term[], rawText: string): Term[] {
  const lower = rawText.toLowerCase();
  return terms.filter((term) => term.word.toLowerCase().includes(lower));
}
