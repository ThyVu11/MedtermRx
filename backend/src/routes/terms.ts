import { Router, Request, Response, NextFunction } from "express";
import "dotenv/config";

import type { QuizQuestion } from "../types";
import {
  getConfusables,
  getTerms,
  S3_CONFUSABLES_KEY,
  S3_TERMS_KEY,
} from "../services/term-data.service";
import {
  confusablesCache,
  createDownloadUrl,
  handleRouteError,
  normalizeCategory,
  shuffle,
  termHasCategory,
  termsCache,
} from "../utils/utils";
import {
  isTermSearchReady,
  searchTerms,
} from "../services/term-search.service";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                           Presigned download URLs                          */
/* -------------------------------------------------------------------------- */

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
router.get("/", async (_request, response, next) => {
  try {
    const terms = await getTerms();
    return response.json(terms);
  } catch (error) {
    handleRouteError(error, next);
  }
});

/* -------------------------------------------------------------------------- */
/*                                    Search                                    */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/terms/search?q=cardio&limit=20
 */
router.get("/search", (request, response, next) => {
  try {
    const query =
      typeof request.query.q === "string" ? request.query.q.trim() : "";

    const rawLimit =
      typeof request.query.limit === "string"
        ? Number(request.query.limit)
        : 20;

    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), 1), 100)
      : 20;

    if (!query) {
      return response.json({
        query: "",
        total: 0,
        results: [],
      });
    }

    if (!isTermSearchReady()) {
      return response.status(503).json({
        error: "Search index is not ready.",
      });
    }

    const results = searchTerms(query, limit);

    return response.json({
      query,
      total: results.length,
      results,
    });
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
