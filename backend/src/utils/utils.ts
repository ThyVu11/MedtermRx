export async function createDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 300,
  });
}

import { GetObjectCommand } from "@aws-sdk/client-s3";
/* -------------------------------------------------------------------------- */
/*                                    Cache                                   */
/* -------------------------------------------------------------------------- */

import {
  CACHE_TTL_MS,
  getBucketName,
  loadJsonFromS3,
  s3,
} from "../services/term-data.service";
import { ConfusablePair, RootEntry, Term } from "../types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextFunction } from "express";

type DataCache<T> = {
  data: T | null;
  loadedAt: number;
  request: Promise<T> | null;
};

export const termsCache: DataCache<Term[]> = {
  data: null,
  loadedAt: 0,
  request: null,
};

export const rootsCache: DataCache<RootEntry[]> = {
  data: null,
  loadedAt: 0,
  request: null,
};

export const confusablesCache: DataCache<ConfusablePair[]> = {
  data: null,
  loadedAt: 0,
  request: null,
};

export function isCacheValid<T>(
  cache: DataCache<T>,
): cache is DataCache<T> & { data: T } {
  return cache.data !== null && Date.now() - cache.loadedAt < CACHE_TTL_MS;
}

export async function loadCachedData<T>(
  cache: DataCache<T>,
  key: string,
): Promise<T> {
  if (isCacheValid(cache)) {
    return cache.data;
  }

  /*
   * Reuse the same pending request when several users request
   * the data at the same time.
   */
  if (cache.request) {
    return cache.request;
  }

  cache.request = loadJsonFromS3<T>(key);

  try {
    const data = await cache.request;

    cache.data = data;
    cache.loadedAt = Date.now();

    return data;
  } finally {
    cache.request = null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                Helper functions                            */
/* -------------------------------------------------------------------------- */

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

export function normalizeCategory(category: unknown): string | undefined {
  if (typeof category !== "string") {
    return undefined;
  }

  const normalized = category.trim().toLowerCase();

  return normalized || undefined;
}

export function termHasCategory(term: Term, category: string): boolean {
  return term.category.some((value) => value.trim().toLowerCase() === category);
}

export function handleRouteError(error: unknown, next: NextFunction): void {
  console.error("Terms route failed:", error);
  next(error);
}
