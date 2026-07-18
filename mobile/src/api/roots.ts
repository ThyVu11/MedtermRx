import { apiGet } from "./client";
import type { RootEntry } from "../types/types";

export function getAllRoots(): Promise<RootEntry[]> {
  return apiGet<RootEntry[]>("/roots");
}
