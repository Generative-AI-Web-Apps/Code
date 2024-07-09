'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';

export async function continueConversation(history) {
  'use server';
  const stream = createStreamableValue();
  (async () => {
    const { textStream } = await streamText({
      model: openai('gpt-3.5-turbo'),
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