import { Router } from "express";
import "dotenv/config";
import multer from "multer";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("openai", openai)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ]);

    if (!allowedTypes.has(file.mimetype)) {
      callback(
        new Error(
          `Unsupported image type: ${file.mimetype}`,
        ),
      );
      return;
    }

    callback(null, true);
  },
});

router.post(
  "/",
  upload.single("image"),
  async (request, response) => {
    try {
      if (!request.file) {
        response.status(400).json({
          error: "No image was uploaded.",
        });
        return;
      }

      const mimeType =
        request.file.mimetype ||
        "image/jpeg";

      const base64 =
        request.file.buffer.toString(
          "base64",
        );

      const imageUrl =
        `data:${mimeType};base64,${base64}`;

      const result =
        await openai.responses.create({
          model: "gpt-5.4-mini",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `
Transcribe the visible text in this image.

Rules:
- Return only text visible in the image.
- Preserve medical spelling exactly.
- Preserve paragraph and line breaks when practical.
- Do not explain, summarize, correct, or add words.
- Ignore page numbers, decorative borders, and unrelated UI icons.
- If no readable text is present, return an empty string.
                  `.trim(),
                },
                {
                  type: "input_image",
                  image_url: imageUrl,
                  detail: "high",
                },
              ],
            },
          ],
        });

      const text =
        result.output_text.trim();

      response.json({
        text,
      });
    } catch (error) {
      console.error("OCR failed:", error);

      response.status(500).json({
        error:
          "The image could not be recognized.",
      });
    }
  },
);

export default router;