import type { Term, WordPart } from "../types/types";

const ANCHOR_IMAGES: Record<string, { image: string; emoji: string }> = {
  slow: { image: "a sloth", emoji: "🦥" },
  fast: { image: "a cheetah", emoji: "🐆" },
  heart: { image: "a beating heart", emoji: "❤️" },
  "heart condition": { image: "a heart-rate monitor", emoji: "📈" },
  kidney: { image: "a bean-shaped kidney", emoji: "🫘" },
  liver: { image: "a glowing liver", emoji: "🔥" },
  stomach: { image: "a rumbling stomach", emoji: "🍲" },
  bone: { image: "a bone", emoji: "🦴" },
  joint: { image: "a creaky hinge", emoji: "🔩" },
  skin: { image: "a layer of skin", emoji: "🧴" },
  nerve: { image: "a sparking wire", emoji: "⚡" },
  breathing: { image: "a breath of air", emoji: "💨" },
  bile: { image: "a small bile sac", emoji: "🟢" },
  "bladder, sac": { image: "a tiny sac", emoji: "🎒" },
  "sugar, glucose": { image: "sugar cubes", emoji: "🧊" },
  pressure: { image: "a garden hose", emoji: "🚿" },
  "away from": { image: "something moving away", emoji: "➡️" },
  toward: { image: "something moving closer", emoji: "⬅️" },
  inflammation: { image: "a small flame", emoji: "🔥" },
  "surgical removal": {
    image: "surgical tongs lifting something out",
    emoji: "🛠️",
  },
  "excessive, above normal": { image: "something overflowing", emoji: "⬆️" },
  "deficient, below normal": { image: "something running empty", emoji: "⬇️" },
  "without, not": { image: "an empty space", emoji: "🚫" },
  "difficult, painful, abnormal": { image: "a tangled knot", emoji: "🪢" },
  rib: { image: "piano-key ribs", emoji: "🎹" },
  "below, under": { image: "a submarine diving under", emoji: "🚤" },
  between: { image: "something squeezed in the middle", emoji: "🤏" },
  around: { image: "a ring wrapped around something", emoji: "⭕" },
  "around, surrounding": {
    image: "a ring wrapped around something",
    emoji: "⭕",
  },
};

function findAnchor(meaning: string) {
  const key = Object.keys(ANCHOR_IMAGES).find(
    (k) =>
      meaning.toLowerCase().includes(k) || k.includes(meaning.toLowerCase()),
  );
  return key ? ANCHOR_IMAGES[key] : null;
}

export interface Mnemonic {
  scene: string;
  emojiStrip: string;
  partBreakdown: { part: WordPart; anchor: string }[];
  generated: boolean;
}

export function generateMnemonic(term: Term): Mnemonic {
  const partBreakdown = term.parts.map((part) => {
    const anchor = findAnchor(part.meaning);
    return { part, anchor: anchor?.image ?? part.meaning };
  });

  const emojiStrip = term.parts
    .map((part) => findAnchor(part.meaning)?.emoji ?? "❔")
    .join("  +  ");

  if (term.mnemonicSeed) {
    return {
      scene: `Picture ${term.mnemonicSeed}. That's ${term.word}: ${term.parts
        .map((p) => `"${p.text}" (${p.meaning})`)
        .join(" + ")}.`,
      emojiStrip,
      partBreakdown,
      generated: false,
    };
  }

  const scene = `Picture ${partBreakdown
    .map((p) => p.anchor)
    .join(
      ", combined with ",
    )} — together they spell out ${term.word}, which means: ${term.definition}`;

  return { scene, emojiStrip, partBreakdown, generated: true };
}
