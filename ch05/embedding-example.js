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

const embeddingDB = {};
const questions = [
  "How do I reset my password?",
  "What should I do if my computer won't start?",
];

const answers = [
  "To reset your password, go to the login page and click 'Forgot Password'. Follow the instructions to reset your password.",
  "If your computer won't start, check the power cable, try restarting it, and if the issue persists, contact support.",
];

for (let i = 0; i < questions.length; i++) {
  const { embedding } = await embed({
    model: model.embedding("text-embedding-3-small"),
    value: questions[i],
  });
  embeddingDB[questions[i]] = embedding;
}

const userQuery = "I forgot my password";

function cosineSimilarity(embedding1, embedding2) {
  // Calculate the dot product of the two embeddings
  const dotProduct = embedding1.reduce(
    (sum, value, index) => sum + value * embedding2[index],
    0
  );

  // Calculate the magnitude (length) of each embedding
  const magnitude1 = Math.sqrt(
    embedding1.reduce((sum, value) => sum + value * value, 0)
  );
  const magnitude2 = Math.sqrt(
    embedding2.reduce((sum, value) => sum + value * value, 0)
  );

  // Return the cosine similarity: dot product divided by the product of the magnitudes
  return dotProduct / (magnitude1 * magnitude2);
}

const { embedding: queryEmbedding } = await embed({
  model: model.embedding("text-embedding-3-small"),
  value: userQuery,
});

let maxSimilarity = -1;
let mostRelevantQuestion = "";

for (const [question, storedEmbedding] of Object.entries(embeddingDB)) {
  const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
  if (similarity > maxSimilarity) {
    maxSimilarity = similarity;
    mostRelevantQuestion = question;
  }
}
