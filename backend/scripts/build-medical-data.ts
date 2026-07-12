import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";
import { ConfusablePair, RootEntry, Term } from "../../mobile/src/types";
import { loadDataset } from "./libs/loadDataset";

interface BaseRecord {
  id: string;
}

/**
 * Resolve paths from this script's location instead of process.cwd().
 *
 * Script:
 * project/scripts/build-medical-data.ts
 *
 * Project root:
 * project/
 */
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);

const BACKEND_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATA_DIR = path.join(BACKEND_ROOT, "data");
const DIST_DIR = path.join(BACKEND_ROOT, "dist");




function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}


async function writeMinifiedJson(
  filename: string,
  data: unknown,
): Promise<number> {
  const outputPath = path.join(DIST_DIR, filename);
  const content = JSON.stringify(data);

  await writeFile(outputPath, content, "utf8");

  return Buffer.byteLength(content, "utf8");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main(): Promise<void> {
  console.log("Medical data build");
  console.log(`Project root: ${BACKEND_ROOT}`);
  console.log(`Source data:  ${DATA_DIR}`);
  console.log(`Output:       ${DIST_DIR}`);

  /**
   * Remove stale generated files before rebuilding.
   * This does not affect backend/data.
   */
  await rm(DIST_DIR, {
    recursive: true,
    force: true,
  });

  await mkdir(DIST_DIR, {
    recursive: true,
  });


 const terms =
    await loadDataset<Term>(
        "terms/**/*.json",
        "terms"
    );

const roots =
    await loadDataset<RootEntry>(
        "roots/**/*.json",
        "roots"
    );

const confusables =
    await loadDataset<ConfusablePair>(
        "confusables/**/*.json",
        "confusables"
    );

  roots.sort((a, b) =>
    normalizeId(a.id).localeCompare(normalizeId(b.id)),
  );

  terms.sort((a, b) =>
    normalizeId(a.id).localeCompare(normalizeId(b.id)),
  );

  confusables.sort((a, b) =>
    normalizeId(a.id).localeCompare(normalizeId(b.id)),
  );

  const rootBytes = await writeMinifiedJson(
    "roots.min.json",
    roots,
  );

  const termBytes = await writeMinifiedJson(
    "terms.min.json",
    terms,
  );

  const confusableBytes = await writeMinifiedJson(
    "confusables.min.json",
    confusables,
  );

  const manifest = {
    schemaVersion: "3.0.0",
    datasetVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    files: {
      roots: {
        path: "roots.min.json",
        records: roots.length,
        bytes: rootBytes,
      },
      terms: {
        path: "terms.min.json",
        records: terms.length,
        bytes: termBytes,
      },
      confusables: {
        path: "confusables.min.json",
        records: confusables.length,
        bytes: confusableBytes,
      },
    },
    totals: {
      records:
        roots.length +
        terms.length +
        confusables.length,
      bytes:
        rootBytes +
        termBytes +
        confusableBytes,
    },
  };

  const manifestContent = JSON.stringify(
    manifest,
    null,
    2,
  );

  await writeFile(
    path.join(DIST_DIR, "manifest.json"),
    manifestContent,
    "utf8",
  );

  console.log("\nMedical data build completed.");
  console.log(
    `Roots:       ${roots.length.toLocaleString()} — ${formatBytes(
      rootBytes,
    )}`,
  );
  console.log(
    `Terms:       ${terms.length.toLocaleString()} — ${formatBytes(
      termBytes,
    )}`,
  );
  console.log(
    `Confusables: ${confusables.length.toLocaleString()} — ${formatBytes(
      confusableBytes,
    )}`,
  );
  console.log(
    `Total:       ${manifest.totals.records.toLocaleString()} — ${formatBytes(
      manifest.totals.bytes,
    )}`,
  );
}

main().catch((error: unknown) => {
  console.error("\nMedical data build failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});