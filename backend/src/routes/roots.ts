import { Router } from "express";
import roots from "../../data/roots/roots.json";
import type { RootEntry } from "../types";

const router = Router();
const data = roots as RootEntry[];

router.get("/", (req, res) => {
  const { category, type, q } = req.query;
  let results = data;

  if (category && typeof category === "string") {
    results = results.filter((r) => r.category === category);
  }
  if (type && typeof type === "string") {
    results = results.filter((r) => r.type === type);
  }
  if (q && typeof q === "string") {
    const needle = q.toLowerCase();
    results = results.filter(
      (r) =>
        r.text.toLowerCase().includes(needle) ||
        r.meaning.toLowerCase().includes(needle)
    );
  }

  res.json(results);
});

router.get("/categories", (_req, res) => {
  const categories = Array.from(new Set(data.map((r) => r.category)));
  res.json(categories);
});

router.get("/:id", (req, res) => {
  const entry = data.find((r) => r.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Root not found" });
  res.json(entry);
});

export default router;
