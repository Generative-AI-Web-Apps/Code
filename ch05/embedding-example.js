import "dotenv/config";
import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
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

// Embed the questions
for (let i = 0; i < questions.length; i++) {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: questions[i],
  });
  embeddingDB[questions[i]] = embedding;
}

const userQuery = "I forgot my password";

// Cosine similarity function
function cosineSimilarity(embedding1, embedding2) {
  const dotProduct = embedding1.reduce(
    (sum, value, index) => sum + value * embedding2[index],
    0
  );

  const magnitude1 = Math.sqrt(
    embedding1.reduce((sum, value) => sum + value * value, 0)
  );
  const magnitude2 = Math.sqrt(
    embedding2.reduce((sum, value) => sum + value * value, 0)
  );

  return dotProduct / (magnitude1 * magnitude2);
}

const { embedding: queryEmbedding } = await embed({
  model: google.textEmbeddingModel("text-embedding-004"),
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

console.log("Most relevant question:", mostRelevantQuestion);
console.log("Similarity score:", maxSimilarity.toFixed(3));