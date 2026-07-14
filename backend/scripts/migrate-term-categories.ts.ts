import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";

interface Term {
  category?: string | string[];
  [key: string]: unknown;
}

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);

// backend/
const BACKEND_ROOT = path.resolve(SCRIPT_DIR, "..");

const INPUT_DIR = path.join(BACKEND_ROOT, "data", "terms");

const OUTPUT_DIR = path.join(BACKEND_ROOT, "data", "terms-v4");

function shouldSkipFile(filePath: string): boolean {
  const filename = path.basename(filePath).toLowerCase();

  return (
    filename.includes("index") ||
    filename.includes("manifest") ||
    filename.includes("schema") ||
    filename.includes("migration-report") ||
    filename.includes("migration-review")
  );
}

async function main(): Promise<void> {
  console.log("Input directory:", INPUT_DIR);
  console.log("Output directory:", OUTPUT_DIR);

  const discoveredFiles = await fg("**/*.json", {
    cwd: INPUT_DIR,
    absolute: true,
    onlyFiles: true,
  });

  const files = discoveredFiles.filter((file) => !shouldSkipFile(file)).sort();

  console.log(`Found ${files.length} JSON file(s).`);

  if (files.length === 0) {
    throw new Error(
      [
        "No term JSON files were found.",
        `Expected directory: ${INPUT_DIR}`,
        "Check that your files are inside backend/data/terms.",
      ].join("\n"),
    );
  }

  let migratedCount = 0;
  let processedCount = 0;

  for (const file of files) {
    const raw = await readFile(file, "utf8");

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.warn(
        `Skipping non-array file: ${path.relative(INPUT_DIR, file)}`,
      );
      continue;
    }

    const terms = parsed as Term[];
    let fileMigrationCount = 0;

    for (const term of terms) {
      processedCount += 1;

      if (typeof term.category === "string") {
        term.category = [term.category];

        migratedCount += 1;
        fileMigrationCount += 1;
      }
    }

    const relativePath = path.relative(INPUT_DIR, file);

    const outputPath = path.join(OUTPUT_DIR, relativePath);

    await mkdir(path.dirname(outputPath), {
      recursive: true,
    });

    await writeFile(outputPath, `${JSON.stringify(terms, null, 2)}\n`, "utf8");

    console.log(`✓ ${relativePath}: ${fileMigrationCount} converted`);
  }

  console.log("\nMigration complete.");
  console.log(`Terms processed: ${processedCount}`);
  console.log(`Categories converted: ${migratedCount}`);
  console.log(`Migrated files written to: ${OUTPUT_DIR}`);
}

main().catch((error: unknown) => {
  console.error("\nMigration failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});
