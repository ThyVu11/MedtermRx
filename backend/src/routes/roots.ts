import { Router, Request, Response, NextFunction } from "express";
import type { RootEntry } from "../types";
import { createDownloadUrl, handleRouteError, loadCachedData, rootsCache } from "../utils/utils";


const router = Router();

const S3_ROOTS_KEY = process.env.S3_ROOTS_KEY?.trim() || "data/roots.json";

export function getRoots(): Promise<RootEntry[]> {
  return loadCachedData<RootEntry[]>(rootsCache, S3_ROOTS_KEY);
}

/**
 * GET /api/roots/data/download-url
 *
 * Returns a temporary S3 URL for roots.json.
 *
 * If this router is mounted at:
 * app.use("/api/roots", rootsRouter)
 *
 * then the route should be "/data/download-url".
 */
router.get(
  "/data/download-url",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const url = await createDownloadUrl(S3_ROOTS_KEY);

      return response.json({ url });
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

/**
 * GET /api/roots
 * GET /api/roots?category=cardiovascular
 * GET /api/roots?type=root
 * GET /api/roots?q=heart
 */
router.get(
  "/",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const roots = await getRoots();

      const category =
        typeof request.query.category === "string"
          ? request.query.category.trim().toLowerCase()
          : undefined;

      const type =
        typeof request.query.type === "string"
          ? request.query.type.trim().toLowerCase()
          : undefined;

      const query =
        typeof request.query.q === "string"
          ? request.query.q.trim().toLowerCase()
          : undefined;

      let results = roots;

      if (category) {
        results = results.filter((root) => {
          if (Array.isArray(root.category)) {
            return root.category.some(
              (value) => value.trim().toLowerCase() === category,
            );
          }

          return String(root.category).trim().toLowerCase() === category;
        });
      }

      if (type) {
        results = results.filter(
          (root) => root.type.trim().toLowerCase() === type,
        );
      }

      if (query) {
        results = results.filter((root) => {
          const textMatches = root.text.toLowerCase().includes(query);

          const meaningMatches = root.meaning.toLowerCase().includes(query);

          return textMatches || meaningMatches;
        });
      }

      return response.json(results);
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

/**
 * GET /api/roots/categories
 */
router.get(
  "/categories",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const roots = await getRoots();

      const categories = Array.from(
        new Set(
          roots.flatMap((root) =>
            Array.isArray(root.category) ? root.category : [root.category],
          ),
        ),
      )
        .filter(
          (category): category is string =>
            typeof category === "string" && category.trim().length > 0,
        )
        .map((category) => category.trim())
        .sort((a, b) => a.localeCompare(b));

      return response.json(categories);
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

/**
 * GET /api/roots/:id
 *
 * Keep this route last because "/:id" can match routes such
 * as "/categories" if it is declared first.
 */
router.get(
  "/:id",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const roots = await getRoots();

      const entry = roots.find((root) => String(root.id) === request.params.id);

      if (!entry) {
        return response.status(404).json({
          error: "Root not found.",
        });
      }

      return response.json(entry);
    } catch (error) {
      handleRouteError(error, next);
    }
  },
);

export default router;
