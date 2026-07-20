import { Document } from "flexsearch";
import { Term } from "../types";

type SearchableTerm = {
  id: string;
  word: string;
  searchTerms: string;
  definition: string;
  plainDefinition: string;
  pronunciation: string;
  parts: string;
  synonyms: string;
  relatedTerms: string;
  tags: string;
  bodySystem: string;
  category: string;
  abbreviation: string;
};

type FlexSearchFieldResult = {
  field: string;
  result: Array<string | number>;
};

const termIndex = new Document<SearchableTerm>({
  document: {
    id: "id",
    index: [
      "word",
      "searchTerms",
      "plainDefinition",
      "definition",
      "parts",
      "synonyms",
      "relatedTerms",
      "tags",
      "bodySystem",
      "category",
      "abbreviation",
    ],
  },

  // Enables prefix search:
  // "card" can match "cardiology".
  tokenize: "forward",

  // Cache commonly repeated searches.
  cache: 100,
});

const termsById = new Map<string, Term>();

let searchIndexReady = false;

const arrayToSearchText = (values: unknown): string => {
  if (!Array.isArray(values)) {
    return "";
  }

  return values
    .map((value) => {
      if (typeof value === "string") {
        return value;
      }

      if (value && typeof value === "object") {
        return Object.values(value)
          .filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
          .join(" ");
      }

      return "";
    })
    .filter(Boolean)
    .join(" ");
};

const termToSearchableDocument = (term: Term): SearchableTerm => {
  return {
    id: term.id,
    word: term.word ?? "",
    searchTerms: arrayToSearchText(term.searchTerms),
    definition: term.definition ?? "",
    plainDefinition: term.plainDefinition ?? "",
    pronunciation: term.pronunciation ?? "",
    parts: arrayToSearchText(term.parts),
    synonyms: arrayToSearchText(term.synonyms),
    relatedTerms: arrayToSearchText(term.relatedTerms),
    tags: arrayToSearchText(term.tags),
    bodySystem: term.bodySystem ?? "",
    category: arrayToSearchText(term.category),
    abbreviation: term.commonAbbreviation ?? "",
  };
};

export const buildTermSearchIndex = (terms: Term[]): void => {
  termIndex.clear();
  termsById.clear();

  for (const term of terms) {
    if (!term.id || !term.word) {
      continue;
    }

    termsById.set(term.id, term);
    termIndex.add(termToSearchableDocument(term));
  }

  searchIndexReady = true;

  console.log(
    `[FlexSearch] Indexed ${termsById.size.toLocaleString()} medical terms`,
  );
};

export const isTermSearchReady = (): boolean => {
  return searchIndexReady;
};

export const searchTerms = (query: string, limit = 20): Term[] => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery || !searchIndexReady) {
    return [];
  }

  /*
   * Document.search() returns results grouped by indexed field:
   *
   * [
   *   { field: "word", result: ["term-1", "term-2"] },
   *   { field: "definition", result: ["term-3"] }
   * ]
   */
  const searchResults = termIndex.search(normalizedQuery, {
    limit,
    suggest: true,
  }) as FlexSearchFieldResult[];

  const rankedIds: string[] = [];
  const seenIds = new Set<string>();

  /*
   * Field order matters. Word and searchTerms are indexed first,
   * so their results receive priority over definition matches.
   */
  for (const fieldResult of searchResults) {
    for (const rawId of fieldResult.result) {
      const id = String(rawId);

      if (!seenIds.has(id)) {
        seenIds.add(id);
        rankedIds.push(id);
      }

      if (rankedIds.length >= limit) {
        break;
      }
    }

    if (rankedIds.length >= limit) {
      break;
    }
  }

  return rankedIds
    .map((id) => termsById.get(id))
    .filter((term): term is Term => Boolean(term));
};
