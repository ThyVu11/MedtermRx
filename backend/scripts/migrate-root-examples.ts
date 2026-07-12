import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

interface LegacyRoot {
  id: string;
  text: string;
  type: "prefix" | "root" | "combining_vowel" | "suffix";
  meaning: string;
  plainMeaning?: string;
  origin?: string;
  category: string;
  bodySystem?: string;
  examples: Array<string | MedicalRootExample>;
  relatedRoots: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  frequency?: number;
  mnemonicSeed?: string;
}

interface MedicalRootExample {
  term: string;
  meaning: string;
}

interface MedicalTerm {
  id: string;
  word: string;
  definition: string;
  plainDefinition: string;
  synonyms?: string[];
  searchTerms?: string[];
}

const INPUT_DIR = path.resolve("src/data/roots");
const OUTPUT_DIR = path.resolve("src/data/roots-v2");
const TERMS_FILE = path.resolve("src/data/terms/terms.json");

const files = await fg("**/*.json", {
    cwd: INPUT_DIR,
    absolute: true,
});

console.log(INPUT_DIR);
console.log(files.length);

files.forEach(f => console.log(f));



function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildTermLookup(terms: MedicalTerm[]): Map<string, MedicalTerm> {
  const lookup = new Map<string, MedicalTerm>();

  for (const term of terms) {
    const searchableValues = [
      term.id,
      term.word,
      ...(term.synonyms ?? []),
      ...(term.searchTerms ?? []),
    ];

    for (const value of searchableValues) {
      const key = normalize(value);

      if (key && !lookup.has(key)) {
        lookup.set(key, term);
      }
    }
  }

  return lookup;
}

function migrateExample(
  example: string | MedicalRootExample,
  termLookup: Map<string, MedicalTerm>,
): MedicalRootExample {
  // Already migrated
  if (typeof example !== "string") {
    return {
      term: example.term.trim(),
      meaning: example.meaning.trim(),
    };
  }

  const termName = example.trim();
  const matchedTerm = termLookup.get(normalize(termName));

  return {
    term: termName,
    meaning:
      matchedTerm?.plainDefinition ||
      matchedTerm?.definition ||
      "Meaning requires review.",
  };
}

async function main(): Promise<void> {
  const termsRaw = await readFile(TERMS_FILE, "utf8");
  const terms = JSON.parse(termsRaw) as MedicalTerm[];
  const termLookup = buildTermLookup(terms);

  const files = await fg("**/*.json", {
    cwd: INPUT_DIR,
    absolute: true,
  });

  console.log(INPUT_DIR);
  console.log(files);
  console.log(`Found ${files.length} json files`);

  let migratedRootCount = 0;
  let migratedExampleCount = 0;
  let reviewCount = 0;

  const reviewItems: Array<{
    file: string;
    rootId: string;
    example: string;
  }> = [];

  for (const file of files.sort()) {
    // Skip manifests and schema files.
    if (file.includes("index")) continue;

    const raw = await readFile(file, "utf8");
    const roots = JSON.parse(raw) as LegacyRoot[];

    if (!Array.isArray(roots)) {
      console.warn(`Skipping non-array JSON file: ${file}`);
      continue;
    }

    const migratedRoots = roots.map((root) => {
      const migratedExamples = root.examples.map((example) => {
        const migrated = migrateExample(example, termLookup);

        migratedExampleCount += 1;

        if (migrated.meaning === "Meaning requires review.") {
          reviewCount += 1;

          reviewItems.push({
            file: path.relative(INPUT_DIR, file),
            rootId: root.id,
            example:
              typeof example === "string"
                ? example
                : example.term,
          });
        }

        return migrated;
      });

      migratedRootCount += 1;

      return {
        ...root,
        examples: migratedExamples,
      };
    });

    const relativePath = path.relative(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, relativePath);

    await mkdir(path.dirname(outputPath), {
      recursive: true,
    });

    await writeFile(
      outputPath,
      JSON.stringify(migratedRoots, null, 2),
      "utf8",
    );

    console.log(`Migrated ${relativePath}`);
  }

  await mkdir(OUTPUT_DIR, {
    recursive: true,
  });

  await writeFile(
    path.join(OUTPUT_DIR, "migration-review.json"),
    JSON.stringify(reviewItems, null, 2),
    "utf8",
  );

  const report = {
    migratedRootCount,
    migratedExampleCount,
    examplesRequiringReview: reviewCount,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(
    path.join(OUTPUT_DIR, "migration-report.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.log("\nMigration complete.");
  console.log(`Roots migrated: ${migratedRootCount}`);
  console.log(`Examples migrated: ${migratedExampleCount}`);
  console.log(`Examples requiring review: ${reviewCount}`);
}

main().catch((error: unknown) => {
  console.error("Migration failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});