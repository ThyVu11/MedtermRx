import { Router } from "express";
import terms from "../../data/terms/terms.json";
import confusables from "../../data/confusables/confusables.json";
import type { Term, ConfusablePair } from "../types";

const router = Router();
const termData = terms as Term[];
const confusableData = confusables as ConfusablePair[];



router.get("/", (req, res) => {
  const { q, category } = req.query;
  let results = termData;

  if (category && typeof category === "string") {
    results = results.filter((t) => t.category === category);
  }
  if (q && typeof q === "string") {
    const needle = q.toLowerCase();
    results = results.filter((t) => t.word.toLowerCase().includes(needle));
  }

  console.log("results", results.length, { q, category });

  res.json(results);
});

router.post("/scan", (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Provide { text: string } in the request body" });
  }
  const lower = text.toLowerCase();
  const matches = termData.filter((t) => lower.includes(t.word.toLowerCase()));
  res.json({ matches });
});

router.get("/confusables/all", (req, res) => {
  const { termId } = req.query;
  let results = confusableData;
  if (termId && typeof termId === "string") {
    results = results.filter((c) => c.termAId === termId || c.termBId === termId);
  }
  res.json(results);
});

router.get("/:id", (req, res) => {
  const term = termData.find((t) => t.id === req.params.id);
  if (!term) return res.status(404).json({ error: "Term not found" });
  res.json(term);
});

export default router;
