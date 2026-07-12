import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";


const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);
const BACKEND_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DATA_DIR = path.join(BACKEND_ROOT, "data");


function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

export interface BaseRecord {
    id: string;
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  let parsed: unknown;

  try {
    const raw = await readFile(filePath, "utf8");
    parsed = JSON.parse(raw);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    throw new Error(
      `Unable to read ${path.relative(BACKEND_ROOT, filePath)}: ${message}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Expected an array in ${path.relative(
        BACKEND_ROOT,
        filePath,
      )}, but received ${typeof parsed}.`,
    );
  }

  return parsed as T[];
}

function assertUniqueIds<T extends BaseRecord>(
  records: T[],
  datasetName: string,
): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const record of records) {
    if (
      typeof record.id !== "string" ||
      record.id.trim().length === 0
    ) {
      throw new Error(
        `${datasetName} contains a record without a valid string ID.`,
      );
    }

    const normalizedId = normalizeId(record.id);

    if (seen.has(normalizedId)) {
      duplicates.add(normalizedId);
    }

    seen.add(normalizedId);
  }

  if (duplicates.size > 0) {
    throw new Error(
      `Duplicate IDs in ${datasetName}:\n${[...duplicates]
        .sort()
        .map((id) => `- ${id}`)
        .join("\n")}`,
    );
  }
}

export async function loadDataset<T extends BaseRecord>(
  pattern: string,
  datasetName: string,
): Promise<T[]> {
  const discoveredFiles = await fg(pattern, {
    cwd: DATA_DIR,
    absolute: true,
    onlyFiles: true,
  });

  const sourceFiles = discoveredFiles
    .filter((file) => !shouldIgnoreFile(file))
    .sort();

  if (sourceFiles.length === 0) {
    throw new Error(
      [
        `No usable source files found for ${datasetName}.`,
        `Pattern: ${pattern}`,
        `Data directory: ${DATA_DIR}`,
        `Discovered JSON files: ${discoveredFiles.length}`,
      ].join("\n"),
    );
  }

  const merged: T[] = [];

  console.log(`\nLoading ${datasetName}:`);

  for (const file of sourceFiles) {
    const records = await readJsonArray<T>(file);

    merged.push(...records);

    console.log(
      `  ✓ ${records.length.toLocaleString()} records — ${path.relative(
        BACKEND_ROOT,
        file,
      )}`,
    );
  }

  assertUniqueIds(merged, datasetName);

  console.log(
    `  Total: ${merged.length.toLocaleString()} ${datasetName} records`,
  );

  return merged;
}

function shouldIgnoreFile(filePath: string): boolean {
  const filename = path.basename(filePath).toLowerCase();

  return (
    filename.includes("index") ||
    filename.includes("manifest") ||
    filename.includes("schema") ||
    filename.includes("-old") ||
    filename.includes("_old") ||
    filename.includes(".old.")
  );
}