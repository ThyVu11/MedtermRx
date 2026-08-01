export interface BaseRecord {
    id: string;
}

export interface RootEntry extends BaseRecord {
    text: string;
    type: string;
    meaning: string;

    examples: {
        termId: string;
        term: string;
        meaning: string;
    }[];
}

export interface ConfusablePair extends BaseRecord {
    termAId: string;
    termBId: string;
    riskNote: string;
}

export interface WordPart {
    text: string;

    type:
        | "prefix"
        | "root"
        | "combining_form"
        | "combining_vowel"
        | "suffix";

    meaning: string;

    origin?: string;
}

export interface SearchTerm extends BaseRecord {
    word: string;
    searchTerms: string[];
    definition: string;

    category: string[];

    synonyms: string[];

    commonAbbreviation?: string;
}

export interface Term extends SearchTerm {
    parts: WordPart[];

    plainDefinition: string;

    pronunciation: string;

    ipa: string;

    bodySystem: string;

    difficulty: string;

    partOfSpeech: string;

    relatedTerms: string[];

    relatedConfusables: string[];

    antonyms: string[];

    examples: string[];

    clinicalPearls: string[];

    wordFamily: string[];

    tags: string[];

    mnemonicSeed: string;
}
