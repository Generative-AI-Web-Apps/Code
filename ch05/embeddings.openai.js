import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import "dotenv/config";
const apiKey = process.env.OPENAI_API_KEY;

// Check if API key exists
if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const model = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const { embedding } = await embed({
  model: model.embedding("text-embedding-3-small"),
  value: "The quick brown fox jumps over the lazy dog",
});

const { embeddings } = await embedMany({
    model: model.embedding('text-embedding-3-small'),
    values: [
        'The quick brown fox jumps over the lazy dog',
        'A journey of a thousand miles begins with a single step',
        'To be or not to be, that is the question',
    ],
});

console.log(embedding);
