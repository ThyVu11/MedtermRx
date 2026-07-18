import { Router, Request, Response, NextFunction } from "express";
import "dotenv/config";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { Term, ConfusablePair, QuizQuestion, RootEntry } from "../types";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

const AWS_REGION = process.env.AWS_REGION?.trim() || "us-east-1";

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME?.trim();

const S3_TERMS_KEY = process.env.S3_TERMS_KEY?.trim() || "data/terms.json";

// const S3_ROOTS_KEY = process.env.S3_ROOTS_KEY?.trim() || "data/roots.json";

const S3_CONFUSABLES_KEY =
  process.env.S3_CONFUSABLES_KEY?.trim() || "data/confusables.json";

/**
 * Cache data for 30 minutes.
 *
 * The first request downloads the JSON from S3.
 * Later requests use the in-memory cache.
 */
const CACHE_TTL_MS = 30 * 60 * 1000;

const s3 = new S3Client({
  region: AWS_REGION,
});

/* -------------------------------------------------------------------------- */
/*                                  Validation                                */
/* -------------------------------------------------------------------------- */

function getBucketName(): string {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured.");
  }

  return S3_BUCKET_NAME;
}

/* -------------------------------------------------------------------------- */
/*                                S3 JSON loader                              */
/* -------------------------------------------------------------------------- */

async function loadJsonFromS3<T>(key: string): Promise<T> {
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

/* -------------------------------------------------------------------------- */
/*                                    Cache                                   */
/* -------------------------------------------------------------------------- */

type DataCache<T> = {
  data: T | null;
  loadedAt: number;
  request: Promise<T> | null;
};

const termsCache: DataCache<Term[]> = {
  data: null,
  loadedAt: 0,
  request: null,
};

export const rootsCache: DataCache<RootEntry[]> = {
  data: null,
  loadedAt: 0,
  request: null,
};

const confusablesCache: DataCache<ConfusablePair[]> = {
  data: null,
  loadedAt: 0,
  request: null,
};

function isCacheValid<T>(
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

function getTerms(): Promise<Term[]> {
  return loadCachedData(termsCache, S3_TERMS_KEY);
}

function getConfusables(): Promise<ConfusablePair[]> {
  return loadCachedData(confusablesCache, S3_CONFUSABLES_KEY);
}

/* -------------------------------------------------------------------------- */
/*                                Helper functions                            */
/* -------------------------------------------------------------------------- */

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function normalizeCategory(category: unknown): string | undefined {
  if (typeof category !== "string") {
    return undefined;
  }

  const normalized = category.trim().toLowerCase();

  return normalized || undefined;
}

function termHasCategory(term: Term, category: string): boolean {
  return term.category.some((value) => value.trim().toLowerCase() === category);
}

export function handleRouteError(error: unknown, next: NextFunction): void {
  console.error("Terms route failed:", error);
  next(error);
}

/* -------------------------------------------------------------------------- */
/*                           Presigned download URLs                          */
/* -------------------------------------------------------------------------- */

export async function createDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 300,
  });
}

/**
 * GET /api/terms/data/download-url
 */
router.get("/data/download-url", async (_request, response, next) => {
  try {
    const url = await createDownloadUrl(S3_TERMS_KEY);

    return response.json({ url });
  } catch (error) {
    handleRouteError(error, next);
  }
});

/**
 * GET /api/terms/confusables/data/download-url
 */
router.get(
  "/confusables/data/download-url",
  async (_request, response, next) => {
    try {
      const url = await createDownloadUrl(S3_CONFUSABLES_KEY);

      return response.json({ url });
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                                Cache control                               */
/* -------------------------------------------------------------------------- */

/**
 * Optional endpoint for refreshing the backend cache after
 * uploading a new JSON file to S3.
 *
 * In production, protect this route with authentication.
 *
 * POST /api/terms/cache/clear
 */
router.post("/cache/clear", (_request, response) => {
  termsCache.data = null;
  termsCache.loadedAt = 0;
  termsCache.request = null;

  confusablesCache.data = null;
  confusablesCache.loadedAt = 0;
  confusablesCache.request = null;

  return response.json({
    message: "Terms cache cleared.",
  });
});

/* -------------------------------------------------------------------------- */
/*                                  All terms                                 */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/terms
 * GET /api/terms?q=cardio
 * GET /api/terms?category=cardiovascular
 */
router.get("/", async (request, response, next) => {
  try {
    const terms = await getTerms();

    const query =
      typeof request.query.q === "string"
        ? request.query.q.trim().toLowerCase()
        : undefined;

    const category = normalizeCategory(request.query.category);

    let results = terms;

    if (category) {
      results = results.filter((term) => termHasCategory(term, category));
    }

    if (query) {
      results = results.filter((term) => {
        const wordMatches = term.word.toLowerCase().includes(query);

        const searchTermsMatch =
          term.searchTerms?.some((value) =>
            value.toLowerCase().includes(query),
          ) ?? false;

        return wordMatches || searchTermsMatch;
      });
    }

    return response.json(results);
  } catch (error) {
    handleRouteError(error, next);
  }
});

/* -------------------------------------------------------------------------- */
/*                                    Scan                                    */
/* -------------------------------------------------------------------------- */

router.post("/scan", async (request, response, next) => {
  try {
    const { text } = request.body as {
      text?: unknown;
    };

    if (typeof text !== "string" || !text.trim()) {
      return response.status(400).json({
        error: "Provide { text: string } in the request body.",
      });
    }

    const terms = await getTerms();
    const normalizedText = text.toLowerCase();

    const matches = terms.filter((term) =>
      normalizedText.includes(term.word.toLowerCase()),
    );

    return response.json({ matches });
  } catch (error) {
    handleRouteError(error, next);
  }
});

/* -------------------------------------------------------------------------- */
/*                                Confusables                                 */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/terms/confusables/all
 * GET /api/terms/confusables/all?termId=123
 */
router.get("/confusables/all", async (request, response, next) => {
  try {
    const confusables = await getConfusables();

    const termId =
      typeof request.query.termId === "string"
        ? request.query.termId.trim()
        : undefined;

    const results = termId
      ? confusables.filter(
          (confusable) =>
            confusable.termAId === termId || confusable.termBId === termId,
        )
      : confusables;

    return response.json(results);
  } catch (error) {
    handleRouteError(error, next);
  }
});

/* -------------------------------------------------------------------------- */
/*                                  Random                                    */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/terms/random
 * GET /api/terms/random?category=cardiovascular
 * GET /api/terms/random?count=20
 */
router.get(
  "/random",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const terms = await getTerms();

      const category = normalizeCategory(request.query.category);

      const pool = category
        ? terms.filter((term) => termHasCategory(term, category))
        : terms;

      if (pool.length === 0) {
        return response.status(404).json({
          error: "No terms found for this category.",
        });
      }

      const rawCount =
        typeof request.query.count === "string"
          ? Number(request.query.count)
          : undefined;

      const count =
        rawCount !== undefined && Number.isFinite(rawCount) && rawCount > 0
          ? Math.min(Math.floor(rawCount), pool.length)
          : pool.length;

      return response.json(shuffle(pool).slice(0, count));
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                                    Quiz                                    */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/terms/quiz
 * GET /api/terms/quiz?category=cardiovascular
 * GET /api/terms/quiz?count=20
 */
router.get(
  "/quiz",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const terms = await getTerms();

      const category = normalizeCategory(request.query.category);

      const pool = category
        ? terms.filter((term) => termHasCategory(term, category))
        : terms;

      if (pool.length < 4) {
        return response.status(400).json({
          error: "At least four terms are required to build a quiz.",
        });
      }

      const rawCount =
        typeof request.query.count === "string"
          ? Number(request.query.count)
          : undefined;

      const count =
        rawCount !== undefined && Number.isFinite(rawCount) && rawCount > 0
          ? Math.min(Math.floor(rawCount), pool.length)
          : pool.length;

      const selectedTerms = shuffle(pool).slice(0, count);

      const questions: QuizQuestion[] = selectedTerms.map((term) => {
        const distractorPool = pool.filter(
          (other) =>
            other.id !== term.id && other.definition !== term.definition,
        );

        const wrongChoices = shuffle(distractorPool)
          .slice(0, 3)
          .map((other) => other.definition);

        const choices = shuffle([...wrongChoices, term.definition]);

        return {
          id: term.id,
          term: term.word,
          choices,
          correctAnswer: term.definition,
          category: term.category,
        };
      });

      return response.json(questions);
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                                Single term                                 */
/* -------------------------------------------------------------------------- */

/**
 * Keep this route last because "/:id" matches almost any
 * single path segment.
 *
 * GET /api/terms/:id
 */
router.get("/:id", async (request, response, next) => {
  try {
    const terms = await getTerms();

    const term = terms.find((item) => String(item.id) === request.params.id);

    if (!term) {
      return response.status(404).json({
        error: "Term not found.",
      });
    }

    return response.json(term);
  } catch (error) {
    handleRouteError(error, next);
  }
});

export default router;
