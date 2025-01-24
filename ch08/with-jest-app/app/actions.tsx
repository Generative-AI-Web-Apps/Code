'use server';

import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { getSupportedModel } from './utils.js';

export async function continueConversation(history: any, provider: any, model: any, mockStreamText: any) {
  'use server';
  const supportedModel = getSupportedModel(provider, model);
  const stream = createStreamableValue();
  
  const textStream = mockStreamText
    ? await mockStreamText({
        model: supportedModel,
        system: "I'm happy to assist you in any way I can. How can I be of service today?",
        messages: history,
      })
    : await streamText({
        model: supportedModel,
        system: "I'm happy to assist you in any way I can. How can I be of service today?",
        messages: history,
      });

  (async () => {
    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value,
  };
}
