import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeText(text, language) {
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a text summarizer." },
      {
        role: "user",
        content: `Summarize the following content in ${language}:\n${text}`
      }
    ]
  });

  return result.choices[0].message.content;
}
