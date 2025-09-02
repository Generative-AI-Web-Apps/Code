import "dotenv/config";
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Counts the tokens for a given text string.
 * The `countTokens` method requires the text to be formatted as an array of contents.
 * @param {string} text - The text to count tokens for.
 */
async function countTextTokens(text) {
  try {
    const response = await ai.models.countTokens({
      model: 'gemini-2.0-flash',
      contents: [{
        parts: [{ text: text }],
      }],
    });
    console.log(`Token count for "${text}":`, response.totalTokens);
  } catch (error) {
    console.error("Error counting tokens:", error);
  }
}

/**
 * Counts the tokens for a full chat history.
 * @param {Array<object>} history - The chat history array.
 */
async function countChatTokens(history) {
  try {
    const response = await ai.models.countTokens({
      model: 'gemini-2.0-flash',
      contents: history,
    });
    console.log("Chat history token count:", response.totalTokens);
  } catch (error) {
    console.error("Error counting chat tokens:", error);
  }
}

/**
 * Gets the embedding for a given text string.
 * @param {string} text - The text to embed.
 * @returns {Array<number>} - The embedding vector.
 */
async function getEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: {
        parts: [{ text: text }],
      },
    });
    return response.embedding;
  } catch (error) {
    console.error("Error getting embedding:", error);
    return null;
  }
}

/**
 * Calculates the cosine similarity between two embedding vectors.
 * @param {Array<number>} embedding1 - The first embedding vector.
 * @param {Array<number>} embedding2 - The second embedding vector.
 * @returns {number} - The cosine similarity score.
 */
function cosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }

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


async function main() {
  const questions = [
    "How do I reset my password?",
    "What should I do if my computer won't start?",
  ];

  const embeddingDB = {};

  for (const question of questions) {
    await countTextTokens(question);

    const embedding = await getEmbedding(question);
    if (embedding) {
      embeddingDB[question] = embedding;
    }
  }

  const userQuery = "I forgot my password";
  await countTextTokens(userQuery);
  const queryEmbedding = await getEmbedding(userQuery);

  if (queryEmbedding) {
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

  const history = [
    { role: "user", parts: [{ text: "Hi my name is Bob" }] },
    { role: "model", parts: [{ text: "Hi Bob!" }] },
  ];

  await countChatTokens(history);

  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    history: history,
  });

  const chatResponse = await chat.sendMessage({
    message: "In one sentence, explain how a computer works to a young child.",
  });
  console.log("Chat response:", chatResponse.usageMetadata);

  const extraMessage = {
    role: "user",
    parts: [{ text: "What is the meaning of life?" }],
  };
  const combinedHistory = chat.getHistory();
  combinedHistory.push(extraMessage);

  await countChatTokens(combinedHistory);
}

main().catch(console.error);


// import {GoogleGenAI} from '@google/genai';
// import "dotenv/config";
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// const prompt = "The quick brown fox jumps over the lazy dog.";
// const countTokensResponse = await ai.models.countTokens({
//   model: "gemini-2.0-flash",
//   contents: prompt,
// });
// console.log(countTokensResponse.totalTokens);

// const generateResponse = await ai.models.generateContent({
//   model: "gemini-2.0-flash",
//   contents: prompt,
// });
// console.log(generateResponse.usageMetadata);