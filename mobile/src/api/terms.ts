import { apiGet } from "./client";
import type { ConfusablePair, Term } from "@/types";

export function getAllTerms(): Promise<Term[]> {
  return apiGet<Term[]>("/terms");
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
