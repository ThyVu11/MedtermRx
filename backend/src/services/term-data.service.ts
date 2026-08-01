import "dotenv/config";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import path from "node:path";
import {
  confusablesCache,
  loadCachedData,
  rootsCache,
  termsCache,
  termsIndexCache,
  type TermIndex,
} from "../utils/utils";
import { ConfusablePair, RootEntry, SearchTerm, Term } from "../types";

/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

export const AWS_REGION = process.env.AWS_REGION?.trim() || "us-east-1";

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME?.trim();

export const S3_TERMS_KEY =
  process.env.S3_TERMS_KEY?.trim() || "data/terms.json";

export const S3_TERMS_LITE_KEY =
  process.env.S3_TERMS_LITE_KEY?.trim() || "data/terms/terms-lite.json";

export const S3_TERMS_INDEX_KEY =
  process.env.S3_TERMS_INDEX_KEY?.trim() || "data/terms.index.json";

// const S3_ROOTS_KEY = process.env.S3_ROOTS_KEY?.trim() || "data/roots.json";

export const S3_CONFUSABLES_KEY =
  process.env.S3_CONFUSABLES_KEY?.trim() || "data/confusables.json";

/**
 * Cache data for 30 minutes.
 *
 * The first request downloads the JSON from S3.
 * Later requests use the in-memory cache.
 */
export const CACHE_TTL_MS = 30 * 60 * 1000;

export const s3 = new S3Client({
  region: AWS_REGION,
});

/* -------------------------------------------------------------------------- */
/*                                  Validation                                */
/* -------------------------------------------------------------------------- */

export function getBucketName(): string {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured.");
  }

  return S3_BUCKET_NAME;
}

export function getTerms(): Promise<SearchTerm[]> {
  return loadCachedData(termsCache, S3_TERMS_LITE_KEY);
}

export async function getTermById(id: string): Promise<Term | null> {
  const index = await loadCachedData<TermIndex>(
    termsIndexCache,
    S3_TERMS_INDEX_KEY,
  );
  const entry = index[id];

  if (!entry) return null;

  if (
    !Number.isSafeInteger(entry.start) ||
    !Number.isSafeInteger(entry.end) ||
    entry.start < 0 ||
    entry.end < entry.start
  ) {
    throw new Error(`Invalid byte range for term "${id}".`);
  }

  const result = await s3.send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: S3_TERMS_KEY,
      Range: `bytes=${entry.start}-${entry.end}`,
    }),
  );

  if (!result.Body) {
    throw new Error(`S3 object "${S3_TERMS_KEY}" returned an empty body.`);
  }

  const jsonText = await result.Body.transformToString("utf-8");

  try {
    const term = JSON.parse(jsonText) as Term;

    if (String(term.id) !== id) {
      throw new Error(
        `Term index mismatch: requested "${id}" but received "${term.id}".`,
      );
    }

    return term;
  } catch (error) {
    throw new Error(
      `Unable to parse indexed term "${id}": ${
        error instanceof Error ? error.message : "Unknown parsing error"
      }`,
    );
  }
}

export function getConfusables(): Promise<ConfusablePair[]> {
  return loadCachedData(confusablesCache, S3_CONFUSABLES_KEY);
}

export function logMemory(label: string): void {
  const memory = process.memoryUsage();
  const toMB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

  console.log(`[memory] ${label}`, {
    rss: `${toMB(memory.rss)} MB`,
    heapUsed: `${toMB(memory.heapUsed)} MB`,
    heapTotal: `${toMB(memory.heapTotal)} MB`,
    external: `${toMB(memory.external)} MB`,
    arrayBuffers: `${toMB(memory.arrayBuffers)} MB`,
  });
}

/* -------------------------------------------------------------------------- */
/*                                S3 JSON loader                              */
/* -------------------------------------------------------------------------- */

export async function loadJsonFromS3<T>(key: string): Promise<T> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  const result = await s3.send(command);

  if (!result.Body) {
    throw new Error(`S3 object "${key}" returned an empty body.`);
  }

  const jsonText = await result.Body.transformToString("utf-8");

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    throw new Error(
      `Unable to parse JSON from S3 object "${key}": ${
        error instanceof Error ? error.message : "Unknown JSON parsing error"
      }`,
    );
  }
}

export const S3_ROOTS_KEY =
  process.env.S3_ROOTS_KEY?.trim() || "data/roots.json";

export function getRoots(): Promise<RootEntry[]> {
  return loadCachedData(rootsCache, S3_ROOTS_KEY);
}
