import { apiGet } from "./client";
import type {
  Category,
  ConfusablePair,
  QuizQuestion,
  Term,
} from "@/types/types";

const ALLOWED_CATEGORIES = new Set([
  "anatomy",
  "hematology",
  "cardiovascular",
  "urinary",
  "neurology",
  "respiratory",
  "gastrointestinal",
  "musculoskeletal",
  "endocrine",
  "reproductive",
  "sensory",
  "diagnostics_and_therapeutics",
  "disease",
  "biological_sciences",
  // "technology",
  // "information_science",
  // "organisms",
  // "behavioral_health",
  // "population",
  // "healthcare",
  // "specialties",
  // "humanities",
  // "integumentary",
  // "general",
]);

export function getAllTerms(): Promise<Term[]> {
  return apiGet<Term[]>("/terms");
}

export async function searchTerms(
  query: string,
  selectedCategory?: Category,
): Promise<Term[]> {
  const q = query.trim().toLowerCase();

  const terms = await apiGet<Term[]>(`/terms?query=${encodeURIComponent(q)}`);

  return terms.filter((term) => {
    const hasAllowedCategory = term.category.some((category) =>
      ALLOWED_CATEGORIES.has(category),
    );

    const matchesSelectedCategory =
      !selectedCategory || term.category.includes(selectedCategory);

    const matchesQuery =
      !q ||
      term.word.toLowerCase().includes(q) ||
      term.searchTerms.some((searchTerm) =>
        searchTerm.toLowerCase().includes(q),
      );

    return hasAllowedCategory && matchesSelectedCategory && matchesQuery;
  });
}

export function getTermById(id: string): Promise<Term> {
  return apiGet<Term>(`/terms/${encodeURIComponent(id)}`);
}

export function getRandomTerms(category?: Category): Promise<Term[]> {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  console.log(`Fetching random terms with params: ${params.toString()}`);
  return apiGet<Term[]>(`/terms/random?${params.toString()}`);
}

export function getConfusablesForTerm(
  termId: string,
): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>(
    `/terms/confusables/all?termId=${encodeURIComponent(termId)}`,
  );
}

export function getAllConfusables(): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>("/terms/confusables/all");
}

export function getQuiz(category?: Category): Promise<QuizQuestion[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  return apiGet<QuizQuestion[]>(`/terms/quiz?${params.toString()}`);
}
