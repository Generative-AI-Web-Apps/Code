import { GoogleGenAI } from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global';

async function getEmbedding(text) {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });

  console.log(`Embedding response for "${text}":`, response);

  return response.embeddings;
}

async function countTokens(text) {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await ai.models.countTokens({
    model: 'gemini-2.0-flash', // Use an appropriate model for token counting
    contents: text,
  });

  console.log(`Token count for "${text}":`, response.totalTokens);

  return response.totalTokens;
}

async function main() {
  const questions = [
    "How do I reset my password?",
    "What should I do if my computer won't start?",
  ];

  const embeddingDB = {};

  for (const question of questions) {
    // Count tokens for each question
    await countTokens(question);

    // Get embedding for each question
    const embedding = await getEmbedding(question);
    embeddingDB[question] = embedding;
  }

  const userQuery = "I forgot my password";

  // Count tokens for user query
  await countTokens(userQuery);

  // Get embedding for user query
  const queryEmbedding = await getEmbedding(userQuery);

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
}

main().catch(console.error);
