/* =========================================================
 * Shared constants
 * ======================================================= */

export const PART_TYPES = [
  "prefix",
  "root",
  "combining_form",
  "combining_vowel",
  "suffix",
] as const;

export const ORIGINS = ["Greek", "Latin", "Greek/Latin", "English"] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export const PARTS_OF_SPEECH = ["noun", "verb", "adjective", "adverb"] as const;

export const CATEGORIES = [
  "anatomy",
  "hematology",
  "cardiovascular",
  "urinary",
  "neurology",
  "respiratory",
  "gastrointestinal",
  "musculoskeletal",
  "sensory",
  "endocrine",
  "reproductive",
  "diagnostics_and_therapeutics",
  "disease",
] as const;

/* =========================================================
 * Shared union types
 * ======================================================= */

export type PartType = (typeof PART_TYPES)[number];

export type Origin = (typeof ORIGINS)[number];

export type Difficulty = (typeof DIFFICULTIES)[number];

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export type Category = (typeof CATEGORIES)[number];

/* =========================================================
 * Navigation
 * ======================================================= */

export type RootStackParamList = {
  Home: undefined;
  Dashboard: undefined;

  Dissector:
    | {
        initialQuery?: string;
      }
    | undefined;

  Scanner: undefined;

  RootLibrary: undefined;

  Confusables: undefined;

  Review: undefined;

  Flashcard:
    | {
        category?: Category;
      }
    | undefined;

  Quiz:
    | {
        category?: Category;
      }
    | undefined;

  QuizResult: {
    score: number;
    total: number;
  };

  TermDetail: {
    termId: string;
  };

  MemoryMap: undefined;

  OrganDetail: {
    category: AnatomicalCategory;
  };

  KeywordMnemonics: undefined;
};

/* =========================================================
 * Medical terminology
 * ======================================================= */

export interface WordPart {
  text: string;
  type: PartType;
  meaning: string;
  origin?: Origin;
}

export interface Term {
  id: string;
  word: string;

  searchTerms: string[];
  parts: WordPart[];

  definition: string;
  plainDefinition: string;

  pronunciation: string;
  ipa?: string;

  category: Category[];
  bodySystem: string;

  difficulty: Difficulty;
  partOfSpeech: PartOfSpeech;

  relatedTerms: string[];
  relatedConfusables: string[];

  synonyms: string[];
  antonyms: string[];

  examples: string[];
  clinicalPearls: string[];

  commonAbbreviation?: string;
  wordFamily: string[];
  tags: string[];

  mnemonicSeed?: string;
  keywordHint?: string;
}

export interface TermSection {
  title: string;
  data: Term[];
}

/* =========================================================
 * Medical roots
 * ======================================================= */

export interface RootEntryExample {
  term: string;
  meaning: string;
  termId?: string;
}

export interface RootEntry {
  id: string;
  text: string;

  type: PartType;

  meaning: string;
  plainMeaning: string;

  origin?: Origin;

  category: Category[];
  bodySystem?: string;

  examples: RootEntryExample[];
  relatedRoots: string[];

  difficulty: Difficulty;
  frequency: number;

  mnemonicSeed?: string;
}

/* =========================================================
 * Confusable terms
 * ======================================================= */

export interface ConfusableHighlight {
  a: string;
  b: string;
}

export interface ConfusablePair {
  id: string;
  termAId: string;
  termBId: string;
  riskNote: string;
  diffHighlight: ConfusableHighlight;
}

/* =========================================================
 * Review and spaced repetition
 * ======================================================= */

export const REVIEW_MODES = [
  "root_recall",
  "spelling",
  "confusable",
  "definition",
] as const;

export type ReviewMode = (typeof REVIEW_MODES)[number];

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export type DeckSource = "search" | "scan" | "manual";

export interface DeckCard {
  termId: string;

  interval: number;
  repetitions: number;
  easeFactor: number;

  dueDate: string;
  lastReviewed?: string;

  addedFrom: DeckSource;
}

/* =========================================================
 * Memory map
 * ======================================================= */

export const ANATOMICAL_CATEGORIES = [
  "Neurological",
  "Respiratory",
  "Cardiovascular",
  "Gastrointestinal",
  "Musculoskeletal",
  "Sensory",
  "Endocrine",
  "Urinary",
  "Reproductive",
] as const;

export type AnatomicalCategory = (typeof ANATOMICAL_CATEGORIES)[number];

export const WORD_PART_CATEGORIES = ["Prefix", "Suffix", "Root"] as const;

export type WordPartCategory = (typeof WORD_PART_CATEGORIES)[number];

/* =========================================================
 * Categories and summaries
 * ======================================================= */

export interface CategorySummary {
  category: Category;
  count: number;
}

/* =========================================================
 * Quiz
 * ======================================================= */

export interface QuizQuestion {
  id: string;
  term: string;
  choices: string[];
  correctAnswer: string;

  /**
   * A term may belong to multiple categories.
   */
  category: Category[];
}
