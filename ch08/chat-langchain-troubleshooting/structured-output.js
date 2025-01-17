import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';
import z from 'zod';
dotenv.config();

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
});

const format = z.object({
  poem: z.string(),
});

const modelWithParser = model.withStructuredOutput(format, {
  method: 'jsonMode',
});

const result = await modelWithParser.invoke('Tell me a poem');
