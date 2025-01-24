'use server';

import { generateText } from 'ai';
import { getSupportedModel } from './utils';

export async function continueConversation(input, history, provider, model) {
  'use server';
  const supportedModel = getSupportedModel(provider, model);
  const result = await generateText({
    system: "I'm happy to assist you in any way I can. How can I be of service today?",
    prompt: input,
    model: supportedModel,
    maxTokens: 512,
  });
  console.log('result', result);
  return {
    messages: history,
    newMessage: result.text,
  };
}
