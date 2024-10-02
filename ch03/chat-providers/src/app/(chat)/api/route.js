import { streamText } from 'ai';
import { getSupportedModel } from './utils';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { messages, provider, model } = await req.json();

  // Get the supported model instance using the getSupportedModel function
  const supportedModel = getSupportedModel(provider, model);

  const result = await streamText({
    model: supportedModel,
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
