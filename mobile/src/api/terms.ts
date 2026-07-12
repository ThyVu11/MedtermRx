import { apiGet } from "./client";
import type { ConfusablePair, Term } from "@/types";

const ALLOWED_CATEGORIES = new Set([
  "anatomy",
  // "technology",
  // "information_science",
  // "organisms",
  // "behavioral_health",
  // "population",
  // "healthcare",
  // "specialties",
  // "humanities",
  "hematology",
  "cardiovascular",
  "urinary",
  "neurology",
  "respiratory",
  "gastrointestinal",
  "musculoskeletal",
  // "integumentary",
  // "general",
  // "endocrine",
  // "reproductive",
  "sensory",
  "diagnostics_and_therapeutics",
  "disease",
  "biological_sciences"
]);


export function getAllTerms(): Promise<Term[]> {
  return apiGet<Term[]>("/terms");
}

export function searchTerms(query: string): Promise<Term[]> {
  const q = query.trim().toLowerCase();

  return apiGet<Term[]>(`/terms?query=${encodeURIComponent(query)}`)
    .then((terms) => {
      return terms.filter((t) => {
        if (!ALLOWED_CATEGORIES.has(t.category)) {
          return false;
        }

      if (!q) {
        return true;
      }

      return (
        t.word.toLowerCase().includes(q) ||
        t.searchTerms.some((s) => s.toLowerCase().includes(q))
      );
    });
  });
}

export function getTermById(id: string): Promise<Term> {
  return apiGet<Term>(`/terms/${encodeURIComponent(id)}`);
}

export function getConfusablesForTerm(termId: string): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>(`/terms/confusables/all?termId=${encodeURIComponent(termId)}`);
}

export function getAllConfusables(): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>("/terms/confusables/all");
}
