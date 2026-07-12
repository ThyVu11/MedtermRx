import type { Term } from "@/types";

export function matchTermsInText(terms: Term[], rawText: string): Term[] {
  const lower = rawText.toLowerCase();
  return terms.filter((term) => lower.includes(term.word.toLowerCase()));
}
