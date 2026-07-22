import { API_BASE_URL, apiGet } from "./client";
import type {
  Category,
  ConfusablePair,
  QuizQuestion,
  Term,
} from "../types/types";

type SearchTermsResponse = {
  query: string;
  total: number;
  results: Term[];
};
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
  "integumentary,"
  // "technology",
  // "information_science",
  // "organisms",
  // "behavioral_health",
  // "population",
  // "healthcare",
  // "specialties",
  // "humanities",
  // "general",
]);


export async function getAllTerms(): Promise<Term[]> {
  const terms = await apiGet<Term[]>("/terms");

  return terms.filter((term) =>
    term.category.some((category) =>
      ALLOWED_CATEGORIES.has(category as Category),
    ),
  );
}

export async function searchTerms(
  query: string,
  selectedCategory?: Category,
  limit = 100, // this can change
): Promise<Term[]> {
  const q = query.trim().toLowerCase();
  // const terms = await apiGet<Term[]>(`/terms?query=${encodeURIComponent(q)}`);

  if (!q) {
    return [];
  }

  const params = new URLSearchParams({
    q: q,
    limit: String(limit),
  });

  const response = await apiGet<SearchTermsResponse>(
    `/terms/search?${params.toString()}`,
  );

  return response.results.filter((term) => {
    const hasAllowedCategory = term.category.some((category) =>
      ALLOWED_CATEGORIES.has(category as Category),
    );

    const matchesSelectedCategory =
      !selectedCategory || term.category.includes(selectedCategory);

    return hasAllowedCategory && matchesSelectedCategory;
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

  const queryString = params.toString();

  return apiGet<Term[]>(
    queryString ? `/terms/random?${queryString}` : "/terms/random",
  );
}

export function getConfusablesForTerm(
  termId: string,
): Promise<ConfusablePair[]> {
  const params = new URLSearchParams({
    termId,
  });

  return apiGet<ConfusablePair[]>(
    `/terms/confusables/all?${params.toString()}`,
  );
}

export function getAllConfusables(): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>("/terms/confusables/all");
}

export function getQuiz(category?: Category): Promise<QuizQuestion[]> {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  const queryString = params.toString();

  return apiGet<QuizQuestion[]>(
    queryString ? `/terms/quiz?${queryString}` : "/terms/quiz",
  );
}
