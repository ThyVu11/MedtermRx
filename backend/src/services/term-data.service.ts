import "dotenv/config";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { confusablesCache, loadCachedData, termsCache } from "../utils/utils";
import { ConfusablePair, Term } from "../types";


/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

export const AWS_REGION = process.env.AWS_REGION?.trim() || "us-east-1";

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME?.trim();

export const S3_TERMS_KEY =
  process.env.S3_TERMS_KEY?.trim() || "data/terms.json";

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

export function getTerms(): Promise<Term[]> {
  return loadCachedData(termsCache, S3_TERMS_KEY);
}

export function getConfusables(): Promise<ConfusablePair[]> {
  return loadCachedData(confusablesCache, S3_CONFUSABLES_KEY);
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

