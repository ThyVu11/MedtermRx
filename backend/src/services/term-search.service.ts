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

// const buildSearchText = (term: Term): string => {
//   return [
//     term.word,
//     term.commonAbbreviation,
//     stringArrayToSearchText(term.searchTerms),
//     stringArrayToSearchText(term.synonyms),
//   ]
//     .filter(
//       (value): value is string =>
//         typeof value === "string" && value.trim().length > 0,
//     )
//     .join(" ");
// };

export const buildTermSearchIndex = (terms: Term[]): void => {
  searchIndexReady = false;
  termIndex.clear();

  indexedTerms = terms.filter(
    (term) => Boolean(term?.id?.trim()) && Boolean(term?.word?.trim()),
  );

  indexedTerms.forEach((term, position) => {
    const searchText = stringArrayToSearchText(term.searchTerms);

    if (searchText) {
      termIndex.add(position, searchText);
    }
  });

  searchIndexReady = true;

  console.log(
    `[FlexSearch] Indexed ${indexedTerms.length.toLocaleString()} medical terms`,
  );
};

export const isTermSearchReady = (): boolean => searchIndexReady;

export const searchTerms = (query: string, limit = 20): Term[] => {
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
    .filter((term): term is Term => {
      if (!term || !Array.isArray(term.searchTerms)) {
        return false;
      }

      return term.searchTerms.some(
        (searchTerm) =>
          typeof searchTerm === "string" &&
          searchTerm.toLowerCase().includes(normalizedQuery),
      );
    })
    .slice(0, safeLimit);
};
