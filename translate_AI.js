import express from "express";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.post("/translate", async (req, res) => {
  const { text, target } = req.body;

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a translator." },
        {
          role: "user",
          content: `Translate the following text into ${target}:\n${text}`
        }
      ]
    });

    res.json({
      translated: result.choices[0].message.content
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () =>
  console.log("AI Translate API running at http://localhost:3000")
);
