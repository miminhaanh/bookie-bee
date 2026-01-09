import express from "express";
import cors from "cors";
import { translateText } from "./aiTranslate.js";
import { summarizeText } from "./aiSummarize.js";

const app = express();
app.use(cors());
app.use(express.json());

// API DỊCH
app.post("/translate", async (req, res) => {
  const { text, target } = req.body;
  const translated = await translateText(text, target);
  res.json({ translated });
});

// API TÓM TẮT
app.post("/summarize", async (req, res) => {
  const { text, language } = req.body;
  const summary = await summarizeText(text, language);
  res.json({ summary });
});

app.listen(3000, () =>
  console.log("🚀 AI Translate & Summarize running on port 3000")
);
