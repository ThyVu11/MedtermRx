import { Index } from "flexsearch";
import type { Term } from "../types";

const termIndex = new Index({
  preset: "memory",
  tokenize: "forward",
  resolution: 2,
  cache: false,
});

let indexedTerms: Term[] = [];
let searchIndexReady = false;

const stringArrayToSearchText = (values: unknown): string => {
  if (!Array.isArray(values)) {
    return "";
  }

  return values
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(" ");
};

const buildSearchText = (term: Term): string => {
  return [
    term.word,
    term.commonAbbreviation,
    stringArrayToSearchText(term.searchTerms),
    stringArrayToSearchText(term.synonyms),
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(" ");
};

export const buildTermSearchIndex = (terms: Term[]): void => {
  searchIndexReady = false;

  termIndex.clear();

  indexedTerms = terms.filter(
    (term) =>
      Boolean(term?.id?.trim()) &&
      Boolean(term?.word?.trim()),
  );

  indexedTerms.forEach((term, index) => {
    const searchText = buildSearchText(term);

    if (searchText) {
      termIndex.add(index, searchText);
    }
  });

  searchIndexReady = true;

  console.log(
    `[FlexSearch] Indexed ${indexedTerms.length.toLocaleString()} medical terms`,
  );
};

export const isTermSearchReady = (): boolean => {
  return searchIndexReady;
};

export const searchTerms = (
  query: string,
  limit = 20,
): Term[] => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery || !searchIndexReady) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const termIndexes = termIndex.search(normalizedQuery, {
    limit: safeLimit,
    suggest: true,
  }) as Array<string | number>;

  return termIndexes
    .map((rawIndex) => indexedTerms[Number(rawIndex)])
    .filter((term): term is Term => Boolean(term));
};

export const clearTermSearchIndex = (): void => {
  termIndex.clear();
  indexedTerms = [];
  searchIndexReady = false;
};