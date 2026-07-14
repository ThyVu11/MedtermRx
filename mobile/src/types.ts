export type PartType = "prefix" | "root" | "suffix" | "combining_vowel";
export const CATEGORIES = [
  "anatomy",
  // "organisms",
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
  // "technology",
  // "information_science",
  // "behavioral_health",
  // "population",
  // "healthcare",
  // "specialties",
  // "humanities",
  // "biological_sciences",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type RootStackParamList = {
  Dashboard: undefined;
  Dissector: { initialQuery?: string } | undefined;
  Scanner: undefined;
  RootLibrary: undefined;
  Confusables: undefined;
  Review: undefined;
  Flashcard: { category?: Category } | undefined;
  TermDetail: { termId: string };
  MemoryMap: undefined;
  OrganDetail: { category: AnatomicalCategory };
  KeywordMnemonics: undefined;
  Quiz: { category?: Category } | undefined;
  QuizResult: { score: number; total: number };
};

export interface TermSection {
  title: string;
  data: Term[];
}

export interface WordPart {
  text: string;
  type: PartType;
  meaning: string;
  origin: "Greek" | "Latin" | "Greek/Latin" | "English";
}

export interface RootEntryExample {
  term: string;
  meaning: string;
  termId: any;
}

export interface RootEntry {
  id: string;
  text: string;
  type: PartType;
  meaning: string;
  plainMeaning: string;
  origin: "Greek" | "Latin" | "Greek/Latin" | "English";
  category: string;
  bodySystem: string;
  examples: RootEntryExample[];
  relatedRoots: string[];
  difficulty: string;
  frequency: number;
  mnemonicSeed: string;
}

export type WordPartType = "prefix" | "root" | "combining_form" | "suffix";

export interface ConfusablePair {
  id: string;
  termAId: string;
  termBId: string;
  riskNote: string;
  diffHighlight: { a: string; b: string };
}

export interface Term {
  id: string;
  word: string;
  searchTerms: string[];
  parts: WordPart[];
  relatedConfusables: string[];
  definition: string;
  plainDefinition: string;
  pronunciation: string;
  ipa: string;
  category: Category[];

  bodySystem: string;

  difficulty: "beginner" | "intermediate" | "advanced";

  partOfSpeech: "noun" | "verb" | "adjective" | "adverb";

  relatedTerms: string[];

  synonyms: string[];

  antonyms: string[];

  examples: string[];

  clinicalPearls: string[];

  commonAbbreviation?: string;

  wordFamily: string[];

  tags: string[];

  mnemonicSeed?: string;

  keywordHint: string | undefined;
}

export type ReviewMode =
  | "root_recall"
  | "spelling"
  | "confusable"
  | "definition";

export interface DeckCard {
  termId: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string;
  lastReviewed?: string;
  addedFrom: "search" | "scan" | "manual";
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// Categories with a real anatomical home, used by the Memory Map.
export type AnatomicalCategory =
  | "Neurological"
  | "Respiratory"
  | "Cardiovascular"
  | "Gastrointestinal"
  | "Musculoskeletal"
  | "Sensory"
  | "Endocrine"
  | "Urinary"
  | "Reproductive";

// Categories with no body location, anchored via keyword imagery instead.
export type WordPartCategory = "Prefix" | "Suffix" | "Root";

export interface CategorySummary {
  category: Category;
  count: number;
}

export interface QuizQuestion {
  id: string;
  term: string;
  choices: string[];
  correctAnswer: string;
  category: Category;
}
