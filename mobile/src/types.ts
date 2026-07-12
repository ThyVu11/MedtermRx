export type PartType = "prefix" | "root" | "suffix" | "combining_vowel";
export type CategoryType = "anatomy" |"organisms"| "hematology" | "cardiovascular" | "urinary" | "neurology" | "respiratory" | "gastrointestinal" | "musculoskeletal" | "sensory" | "technology";


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
  plainMeaning:string;
  origin: "Greek" | "Latin" | "Greek/Latin" | "English";
  category: string;
  bodySystem:string;
  examples: RootEntryExample[];
  relatedRoots:string[];
  difficulty: string;
  frequency: number;
  mnemonicSeed: string;
}

export type WordPartType =
  | "prefix"
  | "root"
  | "combining_form"
  | "suffix";


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
  category: string;

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

export type ReviewMode = "root_recall" | "spelling" | "confusable" | "definition";

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
