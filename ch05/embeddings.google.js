import "dotenv/config";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google.textEmbeddingModel("text-embedding-004");

  const inputText = `
List some popular programming languages along with a brief description of each:

1. JavaScript: A versatile language primarily used for web development.
2. Python: Known for its readability and used in data science and web development.
3. Java: A widely-used language for building enterprise-level applications.

4.
`;

  try {
    const { embedding } = await embed({
      model,
      value: inputText
    });

    console.log("Embedding vector length:", embedding.length);
    console.log("First 10 embedding values:", embedding.slice(0, 10));
  } catch (err) {
    console.error("Error generating embedding:", err);
  }
}

main().catch(console.error);