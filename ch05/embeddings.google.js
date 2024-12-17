import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";

import "dotenv/config";

// Check if API keys exist
const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!googleApiKey) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
}

async function runEmbeddingsExample() {
  // Google Single Embedding
  const { embedding: googleEmbedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004", {
      apiKey: googleApiKey,
    }),
    value: "The quick brown fox jumps over the lazy dog",
  });

  // Google Multiple Embeddings with Custom Dimensionality
  const { embeddings: googleEmbeddings } = await embedMany({
    model: google.textEmbeddingModel("text-embedding-004", {
      outputDimensionality: 512,
      apiKey: googleApiKey,
    }),
    values: [
      "The quick brown fox jumps over the lazy dog",
      "A journey of a thousand miles begins with a single step",
      "To be or not to be, that is the question",
    ],
  });

  // Logging results
  console.log("Google Single Embedding:", googleEmbedding);
  console.log("Google Multiple Embeddings:", googleEmbeddings);
}

runEmbeddingsExample().catch(console.error);
