'use server';

import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import {getSupportedModel} from './utils';

export async function continueConversation(history, provider, model) {
  'use server';
  const supportedModel = getSupportedModel(provider, model);
  const stream = createStreamableValue();
  (async () => {
    const { textStream } = await streamText({
      model: supportedModel,
      system: "I'm happy to assist you in any way I can. How can I be of service today?",
      messages: history,
    });

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