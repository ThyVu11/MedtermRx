import { Router } from "express";
import type { DeckCard } from "../types";

const router = Router();
const store = new Map<string, DeckCard[]>();

router.get("/:userId", (req, res) => {
  const deck = store.get(req.params.userId) ?? [];
  res.json(deck);
});

router.put("/:userId", (req, res) => {
  const { deck } = req.body as { deck?: DeckCard[] };
  if (!Array.isArray(deck)) {
    return res.status(400).json({ error: "Provide { deck: DeckCard[] } in the request body" });
  }
  store.set(req.params.userId, deck);
  res.json({ ok: true, count: deck.length });
});

export default router;
