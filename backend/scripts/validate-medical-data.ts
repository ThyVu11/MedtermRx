import { loadDataset } from "./libs/loadDataset";
import { ConfusablePair, RootEntry, Term } from "./libs/types";

// Collect non-fatal warnings during validation
const warnings: string[] = [];

function validateTerms(terms: Term[]) {
    for (const term of terms) {
        if (!term.id)
            throw new Error("Missing id");

        if (!term.word)
            throw new Error(
                `${term.id} missing word`
            );

        if (!term.definition)
            throw new Error(
                `${term.id} missing definition`
            );

        if (!term.parts)
            throw new Error(
                `${term.id} missing parts`
            );
    }
}

function validateRoots(
    roots: RootEntry[]
) {
    const validTypes = new Set([
        "prefix",
        "root",
        "combining_form",
        "combining_vowel",
        "suffix",
    ]);

    for (const root of roots) {
        if (!validTypes.has(root.type)) {
            throw new Error(
                `${root.id} has invalid type ${root.type}`
            );
        }
    }
}

function validateConfusables(
    confusables: ConfusablePair[]
) {
    for (const conf of confusables) {
        if (!conf.termAId)
            throw new Error(
                `${conf.id} missing termAId`
            );

        if (!conf.termBId)
            throw new Error(
                `${conf.id} missing termBId`
            );
    }
}

function validateReferences(
    roots: RootEntry[],
    terms: Term[],
    confusables: ConfusablePair[]
) {
    const termIds = new Set(
        terms.map((t) => t.id)
    );

    const confIds = new Set(
        confusables.map((c) => c.id)
    );

    for (const term of terms) {
        for (const related of term.relatedTerms ?? []) {
            if (!termIds.has(related)) {
                warnings.push(
                    `${term.id} references unknown related term ${related}`,
                );
            }
        }
        if (warnings.length > 0) {
            console.warn(
                `\nValidation completed with ${warnings.length} warning(s):`,
            );

            for (const warning of warnings) {
                console.warn(`- ${warning}`);
            }
        }

        for (const conf of term.relatedConfusables ?? []) {
            if (!confIds.has(conf)) {
                throw new Error(
                    `${term.id} references unknown confusable ${conf}`
                );
            }
        }
    }

    for (const root of roots) {
        for (const ex of root.examples ?? []) {
            if (!termIds.has(ex.termId)) {
                throw new Error(
                    `${root.id} example references unknown term ${ex.termId}`
                );
            }
        }
    }
}

function validateRelatedTerms(
  terms: Term[],
  warnings: string[],
): void {
  const termIds = new Set(
    terms.map((term) => term.id.trim().toLowerCase()),
  );

  for (const term of terms) {
    for (const related of term.relatedTerms ?? []) {
      const relatedId = related.trim().toLowerCase();

      if (!termIds.has(relatedId)) {
        warnings.push(
          `${term.id} references unknown related term ${related}`,
        );
      }
    }
  }
}

async function main() {
    console.log("Validating medical dataset...\n");

    const roots = await loadDataset<RootEntry>(
        "roots/**/*.json",
        "roots"
    );

    const terms = await loadDataset<Term>(
        "terms/**/*.json",
        "terms"
    );

    const confusables = await loadDataset<ConfusablePair>(
        "confusables/**/*.json",
        "confusables"
    );

    validateTerms(terms);

    validateRoots(roots);

    validateConfusables(confusables);

    validateReferences(
        roots,
        terms,
        confusables
    );

    console.log("\n✅ Validation passed.");
}

main().catch((err) => {
    console.error("\n❌ Validation failed.\n");
    console.error(err);

    process.exit(1);
});