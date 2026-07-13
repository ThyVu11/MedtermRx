import { Router } from "express";
import OpenAI from "openai";

import type { Term } from "../types";

// Adjust this import to match how your server loads terms.
import termData from "../../data/terms/terms.json";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TutorMode =
  | "chat"
  | "simple"
  | "mnemonic"
  | "clinical_example"
  | "compare"
  | "quiz";

interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

interface TutorRequest {
  termId: string;
  message?: string;
  mode?: TutorMode;
  previousResponseId?: string;
  history?: TutorMessage[];
}

const tutorInstructions = `
You are RootRx AI Tutor, an educational medical-terminology tutor.

Your purpose:
- Teach medical vocabulary.
- Explain prefixes, roots, combining forms, combining vowels, and suffixes.
- Help students remember terms.
- Provide educational clinical context.

Rules:
- Use the supplied RootRx term record as the primary source of truth.
- Never invent a word-part breakdown.
- If the supplied data does not support a claim, clearly say so.
- Do not diagnose a user or recommend personal medical treatment.
- Do not present educational examples as medical advice.
- Keep answers clear, friendly, and appropriate for a healthcare student.
- Use short paragraphs and compact formatting.
- When relevant, point out confusable terms.
- If asked for a quiz, do not reveal the answer until after the question.
`.trim();

function getModePrompt(
  mode: TutorMode,
  term: Term,
  message?: string,
): string {
  switch (mode) {
    case "simple":
      return `
Explain "${term.word}" in very simple language.

Include:
1. Plain meaning
2. Word-part breakdown
3. One memory-friendly analogy
      `.trim();

    case "mnemonic":
      return `
Create a short, memorable mnemonic for "${term.word}".

Use its verified word parts.
Make it vivid but medically accurate.
      `.trim();

    case "clinical_example":
      return `
Create one short, realistic educational patient-care example using "${term.word}".

Then explain why the term applies.
Do not diagnose the student or reader.
      `.trim();

    case "compare":
      return `
Explain how "${term.word}" differs from its most relevant related or confusable terms.

Use only relatedTerms, relatedConfusables, synonyms, antonyms, and wordFamily from the supplied record.
If the record does not contain enough comparison data, say so.
      `.trim();

    case "quiz":
      return `
Quiz the student on "${term.word}".

Ask exactly one question.
Do not provide the answer yet.
The question may test:
- definition
- word parts
- category
- a short clinical example
      `.trim();

    case "chat":
    default:
      return (
        message?.trim() ||
        `Teach me the most important things about "${term.word}".`
      );
  }
}

router.post("/", async (req, res) => {
  try {
    const {
      termId,
      message,
      mode = "chat",
      previousResponseId,
    } = req.body as TutorRequest;

    if (!termId?.trim()) {
      return res.status(400).json({
        error: "termId is required.",
      });
    }

    const term = (termData as Term[]).find(
      (item) =>
        item.id.trim().toLowerCase() ===
        termId.trim().toLowerCase(),
    );

    if (!term) {
      return res.status(404).json({
        error: "Medical term not found.",
      });
    }

    const userPrompt = getModePrompt(
      mode,
      term,
      message,
    );

    const context = `
ROOTRX VERIFIED TERM RECORD:

${JSON.stringify(term, null, 2)}

STUDENT REQUEST:

${userPrompt}
    `.trim();

    const response = await openai.responses.create({
      model:
        process.env.OPENAI_MODEL ??
        "gpt-5-mini",

      instructions: tutorInstructions,

      input: context,

      previous_response_id:
        previousResponseId || undefined,

      max_output_tokens: 700,
    });

    return res.json({
      answer: response.output_text,
      responseId: response.id,
      termId: term.id,
      term: term.word,
    });
  } catch (error) {
    console.error("AI Tutor failed:", error);

    if (
      error instanceof OpenAI.RateLimitError
    ) {
      return res.status(429).json({
        error:
          "AI Tutor is temporarily unavailable because the API quota or rate limit was reached.",
      });
    }

    if (
      error instanceof OpenAI.AuthenticationError
    ) {
      return res.status(500).json({
        error:
          "AI Tutor is not configured correctly.",
      });
    }

    return res.status(500).json({
      error:
        "AI Tutor could not generate a response.",
    });
  }
});

export default router;