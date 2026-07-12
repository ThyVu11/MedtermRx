import {
  access,
  mkdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";

const gunzipAsync = promisify(gunzip);

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);

const BACKEND_ROOT = path.resolve(SCRIPT_DIR, "..");
const CACHE_DIR = path.join(BACKEND_ROOT, ".mesh-cache");

const DEFAULT_YEAR = 2026;
const MIN_EXPECTED_XML_BYTES = 10 * 1024 * 1024;

function getYear(): number {
  const yearArg = process.argv.find((arg) =>
    /^\d{4}$/.test(arg),
  );

  if (!yearArg) {
    return DEFAULT_YEAR;
  }

  const year = Number(yearArg);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    throw new Error(
      `Invalid MeSH year "${yearArg}". Use a four-digit year, such as 2026.`,
    );
  }

  return year;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function fileExists(
  filePath: string,
): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

function isGzip(buffer: Buffer): boolean {
  return (
    buffer.length >= 2 &&
    buffer[0] === 0x1f &&
    buffer[1] === 0x8b
  );
}

function looksLikeMeshXml(buffer: Buffer): boolean {
  const beginning = buffer
    .subarray(0, 10_000)
    .toString("utf8")
    .replace(/^\uFEFF/, "");

  return (
    beginning.includes("<?xml") &&
    beginning.includes("DescriptorRecordSet")
  );
}

async function downloadBuffer(
  url: string,
  attempts = 3,
): Promise<Buffer> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt += 1
  ) {
    try {
      console.log(
        `Download attempt ${attempt}/${attempts}...`,
      );

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "medical-terminology-dataset-builder/1.0",
          Accept:
            "application/gzip, application/xml, application/octet-stream",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}`,
        );
      }

      console.log(
        `Content-Type: ${
          response.headers.get("content-type") ??
          "unknown"
        }`,
      );

      console.log(
        `Content-Encoding: ${
          response.headers.get("content-encoding") ??
          "none"
        }`,
      );

      const buffer = Buffer.from(
        await response.arrayBuffer(),
      );

      if (buffer.length === 0) {
        throw new Error(
          "The downloaded response was empty.",
        );
      }

      return buffer;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        const delayMs = attempt * 1500;

        console.warn(
          `Attempt failed. Retrying in ${delayMs} ms...`,
        );

        await new Promise<void>((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : String(lastError);

  throw new Error(
    `Unable to download MeSH after ${attempts} attempts: ${message}`,
  );
}

async function validateXml(
  xmlBuffer: Buffer,
): Promise<void> {
  if (xmlBuffer.length < MIN_EXPECTED_XML_BYTES) {
    throw new Error(
      `MeSH XML looks too small: ${formatBytes(
        xmlBuffer.length,
      )}.`,
    );
  }

  if (!looksLikeMeshXml(xmlBuffer)) {
    const preview = xmlBuffer
      .subarray(0, 300)
      .toString("utf8");

    throw new Error(
      [
        "Downloaded content does not appear to be MeSH descriptor XML.",
        `Beginning of response: ${JSON.stringify(
          preview,
        )}`,
      ].join("\n"),
    );
  }
}

async function main(): Promise<void> {
  const year = getYear();
  const force = hasFlag("--force");

  const sourceUrl =
    "https://nlmpubs.nlm.nih.gov/projects/mesh/" +
    `MESH_FILES/xmlmesh/desc${year}.gz`;

  const finalXmlPath = path.join(
    CACHE_DIR,
    `desc${year}.xml`,
  );

  const temporaryXmlPath = path.join(
    CACHE_DIR,
    `desc${year}.xml.tmp`,
  );

  console.log("MeSH descriptor download");
  console.log(`Backend root: ${BACKEND_ROOT}`);
  console.log(`Cache folder: ${CACHE_DIR}`);
  console.log(`Source URL:   ${sourceUrl}`);
  console.log(`Output file:  ${finalXmlPath}`);

  await mkdir(CACHE_DIR, {
    recursive: true,
  });

  if (
    !force &&
    (await fileExists(finalXmlPath))
  ) {
    const existingStats = await stat(
      finalXmlPath,
    );

    if (
      existingStats.size >=
      MIN_EXPECTED_XML_BYTES
    ) {
      console.log("\nMeSH XML already exists.");
      console.log(
        `Size: ${formatBytes(existingStats.size)}`,
      );
      console.log(
        "Use --force to download it again.",
      );
      return;
    }

    console.warn(
      "\nExisting file appears incomplete. Downloading again.",
    );
  }

  await rm(temporaryXmlPath, {
    force: true,
  });

  console.log("\nDownload started...");

  const downloadedBuffer =
    await downloadBuffer(sourceUrl);

  console.log(
    `Downloaded body size: ${formatBytes(
      downloadedBuffer.length,
    )}`,
  );

  let xmlBuffer: Buffer;

  if (isGzip(downloadedBuffer)) {
    console.log(
      "Gzip bytes detected. Decompressing...",
    );

    try {
      xmlBuffer = await gunzipAsync(
        downloadedBuffer,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      throw new Error(
        `Unable to decompress MeSH gzip data: ${message}`,
      );
    }

    console.log(
      `Decompressed size: ${formatBytes(
        xmlBuffer.length,
      )}`,
    );
  } else {
    console.log(
      "Response is already decompressed XML. Skipping gunzip.",
    );

    xmlBuffer = downloadedBuffer;
  }

  console.log("Validating MeSH XML...");

  await validateXml(xmlBuffer);

  await writeFile(
    temporaryXmlPath,
    xmlBuffer,
  );

  const temporaryStats = await stat(
    temporaryXmlPath,
  );

  if (
    temporaryStats.size !== xmlBuffer.length
  ) {
    throw new Error(
      "The temporary XML file size does not match the downloaded data.",
    );
  }

  await rm(finalXmlPath, {
    force: true,
  });

  await rename(
    temporaryXmlPath,
    finalXmlPath,
  );

  const finalStats = await stat(finalXmlPath);

  console.log("\nMeSH download completed.");
  console.log(`Saved to: ${finalXmlPath}`);
  console.log(`Year:     ${year}`);
  console.log(
    `Size:     ${formatBytes(finalStats.size)}`,
  );
}

main().catch(async (error: unknown) => {
  console.error("\nMeSH download failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});