import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const model = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY } );

export async function POST(req) {
  const { text } = await req.json();

  const result = await generateText({
    model: model('models/gemini-1.5-pro-001'),
    maxTokens: 512,
    messages: [
      {
        role: 'system',
        content: "I'm happy to assist you in any way I can. How can I be of service today?",
      },
      { role: 'user', content: text },
    ],
  });
  const message = {
    id: uuidv4(),
    role: result.responseMessages[0].role,
    content: result.text, // Extract content from message
  };
  return Response.json({ message });
}
