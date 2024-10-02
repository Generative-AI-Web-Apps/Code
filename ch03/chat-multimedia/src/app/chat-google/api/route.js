import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, StreamData } from 'ai';
import { processIncomingMessages } from './utils';

export const dynamic = 'force-dynamic';

const model = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function POST(req) {
  const messages = await processIncomingMessages(req);
  const result = await streamText({
    model: model('models/gemini-1.5-pro-001'),
    maxTokens: 512,
    messages: [
      {
        role: 'system',
        content: "I'm happy to assist you in any way I can. How can I be of service today?",
      },
      ...messages,
    ],
  });
  const data = new StreamData();
  const stream = result.toDataStream({
    onFinal(_) {
      data.close();
    },
  });

  return new Response(stream, {
    status: 200,
    contentType: 'text/plain; charset=utf-8',
  });
}
