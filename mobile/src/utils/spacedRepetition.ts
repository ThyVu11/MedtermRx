import type { DeckCard, ReviewQuality } from "../types/types";

export function scheduleNextReview(
  card: DeckCard,
  quality: ReviewQuality,
): DeckCard {
  let { repetitions, easeFactor, interval } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    ...card,
    repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    dueDate: dueDate.toISOString(),
    lastReviewed: new Date().toISOString(),
  };
}

export function newCard(
  termId: string,
  addedFrom: DeckCard["addedFrom"],
): DeckCard {
  return {
    termId,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    addedFrom,
  };
}

export function isDue(card: DeckCard, asOf: Date = new Date()): boolean {
  return new Date(card.dueDate).getTime() <= asOf.getTime();
}

export function dueCards(
  deck: DeckCard[],
  asOf: Date = new Date(),
): DeckCard[] {
  return deck
    .filter((c) => isDue(c, asOf))
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
}
