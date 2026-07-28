import {
  getConfusables,
  getRoots,
  getTerms,
  S3_CONFUSABLES_KEY,
  S3_ROOTS_KEY,
  S3_TERMS_KEY,
} from "../src/services/term-data.service";
import { ConfusablePair, RootEntry, Term } from "../src/types";

// Collect non-fatal warnings during validation
const warnings: string[] = [];

function validateTerms(terms: Term[]) {
  for (const term of terms) {
    if (!term.id) throw new Error("Missing id");

    if (!term.word) throw new Error(`${term.id} missing word`);

    if (!term.definition) throw new Error(`${term.id} missing definition`);

    if (!term.parts) throw new Error(`${term.id} missing parts`);
  }
}

function validateRoots(roots: RootEntry[]): void {
  const validTypes = new Set([
    "prefix",
    "root",
    "combining_form",
    "combining_vowel",
    "suffix",
    "abbreviations_acronyms",
  ]);

  for (const [rootIndex, root] of roots.entries()) {
    const location = `roots[${rootIndex}]`;

    if (typeof root.text !== "string" || !root.text.trim()) {
      throw new Error(`${location}.text must be a non-empty string`);
    }

    if (typeof root.meaning !== "string" || !root.meaning.trim()) {
      throw new Error(`${location}.meaning must be a non-empty string`);
    }

    if (typeof root.category !== "string" || !root.category.trim()) {
      throw new Error(`${location}.category must be a non-empty string`);
    }

    if (!validTypes.has(root.type)) {
      throw new Error(`${location}.type is invalid: ${root.type}`);
    }

    if (!Array.isArray(root.examples)) {
      throw new Error(`${location}.examples must be an array`);
    }

    for (const [exampleIndex, example] of root.examples.entries()) {
      const exampleLocation = `${location}.examples[${exampleIndex}]`;

      if (
        typeof example !== "object" ||
        example === null ||
        Array.isArray(example)
      ) {
        throw new Error(`${exampleLocation} must be an object`);
      }

      if (typeof example.term !== "string" || !example.term.trim()) {
        throw new Error(`${exampleLocation}.term must be a non-empty string`);
      }

      if (typeof example.meaning !== "string" || !example.meaning.trim()) {
        throw new Error(
          `${exampleLocation}.meaning must be a non-empty string`,
        );
      }
    }
  }
}

function validateConfusables(confusables: ConfusablePair[]) {
  for (const conf of confusables) {
    if (!conf.termAId) throw new Error(`${conf.id} missing termAId`);

    if (!conf.termBId) throw new Error(`${conf.id} missing termBId`);
  }
}

const normalize = (value: string): string =>
  value.trim().toLocaleLowerCase("en-US");

function validateReferences(
  terms: Term[],
  confusables: ConfusablePair[],
): void {
  const termWords = new Set(terms.map((term) => normalize(term.word)));
  const confusableIds = new Set(
    confusables.map((confusable) => normalize(confusable.id)),
  );

  for (const term of terms) {
    for (const related of term.relatedTerms ?? []) {
      // Use termWords here if relatedTerms stores words.
      if (!termWords.has(normalize(related))) {
        warnings.push(`${term.id} references unknown related term ${related}`);
      }
    }

    for (const confusableId of term.relatedConfusables ?? []) {
      if (!confusableIds.has(normalize(confusableId))) {
        throw new Error(
          `${term.id} references unknown confusable ${confusableId}`,
        );
      }
    }
  }
}

function validateUniqueIds(
  label: string,
  records: Array<{ id: string }>,
): void {
  const ids = new Set<string>();

  for (const record of records) {
    const id = record.id.trim();

    if (!id) {
      throw new Error(`${label} contains an empty ID.`);
    }

    if (ids.has(id)) {
      throw new Error(`${label} contains duplicate ID "${id}".`);
    }

    ids.add(id);
  }
}

async function main(): Promise<void> {
  console.log("Validating medical datasets from S3...");
  console.log(`Terms key: ${S3_TERMS_KEY}`);
  console.log(`Roots key: ${S3_ROOTS_KEY}`);
  console.log(`Confusables key: ${S3_CONFUSABLES_KEY}`);

  const [terms, roots, confusables] = await Promise.all([
    getTerms(),
    getRoots(),
    getConfusables(),
  ]);

  validateTerms(terms);
  validateRoots(roots);
  validateConfusables(confusables);
  validateReferences(terms, confusables);
  validateUniqueIds("Terms", terms);
  validateUniqueIds("Roots", roots);
  validateUniqueIds("Confusables", confusables);

  console.log(`Terms: ${terms.length}`);
  console.log(`Roots: ${roots.length}`);
  console.log(`Confusables: ${confusables.length}`);

  if (warnings.length > 0) {
    console.warn(`Validation completed with ${warnings.length} warning(s).`);

    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  console.log("Validation passed.");
}

main().catch((err) => {
  console.error("\n❌ Validation failed.\n");
  console.error(err);

  process.exit(1);
});
