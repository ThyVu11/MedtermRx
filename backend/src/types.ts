export type PartType =
  | "prefix"
  | "root"
  | "suffix"
  | "combining_vowel"
  | "abbreviations_acronyms";
export type Category =
  | "anatomy"
  | "organisms"
  | "hematology"
  | "cardiovascular"
  | "urinary"
  | "neurology"
  | "respiratory"
  | "digestive"
  | "musculoskeletal"
  | "sensory"
  | "integumentary"
  | "lymphatic_and_immune";

export interface RootEntryExample {
  term: string;
  meaning: string;
  // termId: string;
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
  parts: PartType[];
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
}

export interface DeckCard {
  termId: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string;
  lastReviewed?: string;
}

export interface QuizQuestion {
  id: string;
  term: string;
  choices: string[];
  correctAnswer: string;
  category: Category[];
}
