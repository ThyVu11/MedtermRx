import express from "express";
import cors from "cors";
import rootsRouter from "./routes/roots";
import termsRouter from "./routes/terms";
import progressRouter from "./routes/progress";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ name: "RootRx API", status: "ok" });
});

app.use("/api/roots", rootsRouter);
app.use("/api/terms", termsRouter);
app.use("/api/progress", progressRouter);

app.listen(PORT, () => {
  console.log(`RootRx API listening on http://localhost:${PORT}`);
});
