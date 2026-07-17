import express from "express";
import cors from "cors";
import rootsRouter from "./routes/roots";
import termsRouter from "./routes/terms";
import progressRouter from "./routes/progress";
import ocrRouter from "./routes/ocr";
import "dotenv/config";

const app = express();

app.use(
  cors({
    origin: true,
  }),
);

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
  });
});

app.get("/", (_req, res) => {
  res.json({ name: "RootRx API", status: "ok" });
});

app.use("/api/ocr", ocrRouter);
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
