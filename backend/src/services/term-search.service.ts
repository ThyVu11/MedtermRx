import { Index } from "flexsearch";
import type { SearchTerm } from "../types";

const termIndex = new Index({
  preset: "memory",
  tokenize: "forward",
  resolution: 2,
  cache: false,
  encoder: {
    minlength: 2,
  },
});

let indexedTerms: readonly SearchTerm[] = [];
let searchIndexReady = false;

const buildSearchText = (term: SearchTerm): string => {
  const values = [
    term.id,
    term.word,
    term.commonAbbreviation,
    ...(term.synonyms ?? []),
    ...(term.searchTerms ?? []),
  ];

  return [
    ...new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim().toLowerCase()),
    ),
  ].join(" ");
};

export const buildTermSearchIndex = (terms: readonly SearchTerm[]): void => {
  searchIndexReady = false;
  termIndex.clear();

  // Reuse the exact array stored in termsCache.
  indexedTerms = terms;

  terms.forEach((term, position) => {
    if (!term?.id?.trim() || !term?.word?.trim()) {
      return;
    }

    const searchText = buildSearchText(term);
    if (searchText) {
      termIndex.add(position, searchText);
    }
  });

  searchIndexReady = true;

  console.log(
    `[FlexSearch] Indexed ${terms.length.toLocaleString()} medical terms`,
  );
};

export const isTermSearchReady = (): boolean => searchIndexReady;

export const searchTerms = (query: string, limit = 20): SearchTerm[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery || !searchIndexReady) {
    return [];
  }

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);

  const positions = termIndex.search(normalizedQuery, {
    limit: safeLimit * 2,
    suggest: false,
  }) as Array<string | number>;

  return positions
    .map((position) => indexedTerms[Number(position)])
    .filter(
      (term): term is SearchTerm =>
        Boolean(term) && buildSearchText(term).includes(normalizedQuery),
    )
    .slice(0, safeLimit);
};
