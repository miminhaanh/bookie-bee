import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function translateText(text, target) {
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional translator." },
      {
        role: "user",
        content: `Translate the following text into ${target}:\n${text}`
      }
    ]
  });

  return result.choices[0].message.content;
}
