import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const model = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req) {
  const { text } = await req.json();

  const result = await generateText({
    system: "I'm happy to assist you in any way I can. How can I be of service today?",
    prompt: text,
    model: model('gpt-4o'),
    maxTokens: 512,
  });
  const message = {
    id: uuidv4(),
    role: result.responseMessages[0].role,
    content: result.text, // Extract content from message
  };
  return Response.json({ message });
}
