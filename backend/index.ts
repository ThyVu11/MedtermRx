import express from "express";
import cors from "cors";
import rootsRouter, { getRoots } from "./src/routes/roots";
import termsRouter from "./src/routes/terms";
import progressRouter from "./src/routes/progress";
// import ocrRouter from "./routes/ocr";
import "dotenv/config";
import { getTerms, logMemory } from "./src/services/term-data.service";
import { buildTermSearchIndex } from "./src/services/term-search.service";

async function startServer(): Promise<void> {
  const app = express();

  const allowedOrigins = [
    "http://localhost:8081",
    "https://medterm.expo.app", //prod
  ];

  app.use(express.json());

  logMemory("before S3");

  const terms = await getTerms();

  app.locals.terms = terms;

  logMemory("after S3 parsing");

  buildTermSearchIndex(terms);

  logMemory("after FlexSearch");
  app.use(
    cors({
      origin(origin, callback) {
        // Native apps and tools may not send an Origin header.
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked origin: ${origin}`));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
    });
  });

  app.get("/", (_req, res) => {
    res.json({ name: "RootRx API", status: "ok" });
  });

  // app.use("/api/ocr", ocrRouter);
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(error);

      const message =
        error instanceof Error ? error.message : "Unexpected server error.";

      response.status(400).json({
        error: message,
      });
    },
  );

  app.use("/api/roots", rootsRouter);
  app.use("/api/terms", termsRouter);
  app.use("/api/progress", progressRouter);

  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend running on port ${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start MedTermRx backend:", error);
  process.exit(1);
});
