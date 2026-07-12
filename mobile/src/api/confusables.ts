import { apiGet } from "./client";
import type { ConfusablePair } from "@/types";

export function getConfusablesForTerm(termId: string): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>(`/terms/confusables/all?termId=${encodeURIComponent(termId)}`);
}

export function getAllConfusables(): Promise<ConfusablePair[]> {
  return apiGet<ConfusablePair[]>("/terms/confusables/all");
}
