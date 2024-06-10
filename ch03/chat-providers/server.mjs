// OpenAI example
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const openaiResponse = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'What is 7+7 and why?' }],
  max_tokens: 150,
});
console.log('OpenAI response:', openaiResponse.choices[0].message.content);
// Cohere example
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

const chat = await cohere.chat({
  model: "command",
  message: "What is 7+7 and why?",
});

console.log(chat);