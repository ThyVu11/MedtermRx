import { Router, Request, Response } from "express";
import "dotenv/config";
import terms from "../../data/terms/terms.json";
import confusables from "../../data/confusables/confusables.json";
import type { Category, Term, ConfusablePair, QuizQuestion } from "../types";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = Router();
const termData = terms as Term[];
const confusableData = confusables as ConfusablePair[];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

router.get("/data/download-url", async (_request, response, next) => {
  try {
    const bucket = process.env.AWS_S3_BUCKET?.trim();

    if (!bucket) {
      return response.status(500).json({
        error: "AWS_S3_BUCKET_NOT_CONFIGURED",
      });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: "terms.json",
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });
    // console.log("here", response.json({ url }));

    return response.json({ url });
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return next(error);
  }
});

router.get("/", (req, res) => {
  const { q, category } = req.query;
  let results = termData;

  if (category && typeof category === "string") {
    results = results.filter((t) =>
      t.category.some((value: any) => value.toLowerCase() === category),
    );
  }
  if (q && typeof q === "string") {
    const needle = q.toLowerCase();
    results = results.filter((t) => t.word.toLowerCase().includes(needle));
  }

  res.json(results);
});

router.post("/scan", (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ error: "Provide { text: string } in the request body" });
  }
  const lower = text.toLowerCase();
  const matches = termData.filter((t) => lower.includes(t.word.toLowerCase()));
  res.json({ matches });
});

router.get("/confusables/all", (req, res) => {
  const { termId } = req.query;
  let results = confusableData;
  if (termId && typeof termId === "string") {
    results = results.filter(
      (c) => c.termAId === termId || c.termBId === termId,
    );
  }
  res.json(results);
});

router.get("/random", (req: Request, res: Response) => {
  try {
    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim().toLowerCase()
        : undefined;

    const pool = category
      ? termData.filter((term) =>
          term.category.some(
            (value) => value.trim().toLowerCase() === category,
          ),
        )
      : termData;

    if (pool.length === 0) {
      return res.status(404).json({
        error: "No terms found for this category.",
      });
    }

    const rawCount =
      typeof req.query.count === "string" ? Number(req.query.count) : undefined;

    const count =
      rawCount !== undefined && Number.isFinite(rawCount) && rawCount > 0
        ? Math.min(Math.floor(rawCount), pool.length)
        : pool.length;

    const shuffled = [...pool];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }

    return res.json(shuffled.slice(0, count));
  } catch (error) {
    console.error("Random terms route failed:", error);

    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Unable to load flashcards.",
    });
  }
});

// GET /api/terms/quiz?category=Prefix
router.get("/quiz", (req: Request, res: Response) => {
  const category =
    typeof req.query.category === "string"
      ? req.query.category.trim().toLowerCase()
      : undefined;

  const pool = category
    ? termData.filter((term) =>
        term.category.some((value) => value.trim().toLowerCase() === category),
      )
    : termData;

  if (pool.length < 4) {
    return res.status(400).json({
      error:
        "Not enough terms in this category to build a quiz. At least 4 terms are required.",
    });
  }

  const rawCount =
    typeof req.query.count === "string" ? Number(req.query.count) : undefined;

  /*
   * No count means use every term in the selected category.
   * A valid count limits the quiz to that number.
   */
  const count =
    rawCount !== undefined && Number.isFinite(rawCount) && rawCount > 0
      ? Math.min(Math.floor(rawCount), pool.length)
      : pool.length;

  const selectedTerms = shuffle(pool).slice(0, count);

  const questions: QuizQuestion[] = selectedTerms.map((term: Term) => {
    /*
     * Prefer distractors from the same category.
     * This makes the quiz more challenging and relevant.
     */
    const distractorPool = pool.filter(
      (other) => other.id !== term.id && other.definition !== term.definition,
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

  return res.json(questions);
});

router.get("/:id", (req, res) => {
  const term = termData.find((t) => t.id === req.params.id);
  if (!term) return res.status(404).json({ error: "Term not found" });
  res.json(term);
});

export default router;
