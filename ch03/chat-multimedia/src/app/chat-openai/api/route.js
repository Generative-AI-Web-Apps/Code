import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { processIncomingMessages } from './utils';

export const dynamic = 'force-dynamic';

const model = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req) {
  const messages = await processIncomingMessages(req);
  const result = await streamText({
    model: model('gpt-4.1-mini'),
    maxTokens: 512,
    messages: [
      {
        role: 'system',
        content: "I'm happy to assist you in any way I can. How can I be of service today?",
      },
      ...messages,
    ],
  });
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
