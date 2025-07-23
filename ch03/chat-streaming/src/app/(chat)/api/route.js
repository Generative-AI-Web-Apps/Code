import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const dynamic = 'force-dynamic';

const model = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req) {
  const { messages } = await req.json();

  const result = await streamText({
    model: model('gemini-2.0-flash'),
    maxTokens: 512,
    messages: [
      {
        role: 'system',
        content: "I'm happy to assist you in any way I can. How can I be of service today?",
      },
      ...messages,
    ],
  });
  const stream = result.toDataStream();
  return new Response(stream, {
    status: 200,
    contentType: 'text/plain; charset=utf-8',
  });
}
