import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { createWorker, PSM } from "tesseract.js";

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
    const metadata = await sharp(req.file.buffer).metadata();

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (!width || !height) {
      res.status(400).json({
        error: "Unable to read image dimensions.",
      });
      return;
    }

    // const processedImage = await sharp(req.file.buffer)
    //   // Enlarge small text
    //   .resize({
    //     width: width * 3,
    //     withoutEnlargement: false,
    //   })
    //   // Remove distracting colors
    //   .grayscale()
    //   // Increase contrast
    //   .normalize()
    //   // Improve character edges
    //   .sharpen()
    //   .png()
    //   .toBuffer();

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: "1",
    });

    const base = sharp(req.file.buffer)
      .resize({
        width: width * 3,
      })
      .grayscale()
      .normalize()
      .sharpen();
    const normalImage = await base.clone().png().toBuffer();

    const invertedImage = await base.clone().negate().png().toBuffer();

    const normalResult = await worker.recognize(normalImage);
    const invertedResult = await worker.recognize(invertedImage);
    const bestResult =
      invertedResult.data.confidence > normalResult.data.confidence
        ? invertedResult
        : normalResult;

    res.json({
      text: bestResult.data.text.trim(),
      confidence: bestResult.data.confidence,
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
