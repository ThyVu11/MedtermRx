import { Router } from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      error: "Image is required.",
    });
    return;
  }

  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(req.file.buffer);

    res.json({
      text: result.data.text.trim(),
    });
  } catch (error) {
    console.error("OCR failed:", error);

    res.status(500).json({
      error: "Unable to recognize text.",
    });
  } finally {
    await worker.terminate();
  }
});

export default router;