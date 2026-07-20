import "dotenv/config";
import express from "express";
import cors from "cors";

import rootsRouter from "./src/routes/roots";
import termsRouter from "./src/routes/terms";
import progressRouter from "./src/routes/progress";

import { getTerms, logMemory } from "./src/services/term-data.service";

import { buildTermSearchIndex } from "./src/services/term-search.service";

async function startServer(): Promise<void> {
  const app = express();

  const allowedOrigins = ["http://localhost:8081", "https://medterm.expo.app"];

  app.use(
    cors({
      origin(origin, callback) {
        // Native apps, curl, Postman, and server-to-server
        // requests may not include an Origin header.
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

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
    });
  });

  app.get("/", (_request, response) => {
    response.json({
      name: "MedTermRx API",
      status: "ok",
    });
  });

  logMemory("before S3");

  const terms = await getTerms();

  // app.locals.terms = terms;

  logMemory("after S3 parsing");

  buildTermSearchIndex(terms);

  logMemory("after FlexSearch");

  app.use("/api/roots", rootsRouter);
  app.use("/api/terms", termsRouter);
  app.use("/api/progress", progressRouter);

  // 404 handler
  app.use((request: express.Request, response: express.Response) => {
    response.status(404).json({
      error: "Route not found.",
      path: request.originalUrl,
    });
  });

  // Error handler must be after all routes.
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

      const isCorsError =
        error instanceof Error &&
        error.message.startsWith("CORS blocked origin:");

      response.status(isCorsError ? 403 : 500).json({
        error: message,
      });
    },
  );

  if (global.gc) {
    global.gc();
    logMemory("after forced GC");
  } else {
    console.warn("Run node with --expose-gc to test forced-GC memory drop");
  }

  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend running on port ${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start MedTermRx backend:", error);
  process.exit(1);
});