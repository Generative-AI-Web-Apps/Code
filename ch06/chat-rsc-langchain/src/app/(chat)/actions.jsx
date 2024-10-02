'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';
import { generateId } from 'ai';
import { prompt } from '../../lib/fewShotPrompt';
import { getSupportedModel } from './utils';

export async function continueConversation(input, provider, model) {
  'use server';
  const supportedModel = getSupportedModel(provider, model);
  const history = getMutableAIState();
  const formattedPrompt = await prompt.format({
    input
  });
  const result = await streamUI({
    model: supportedModel,
    messages: [...history.get(), { role: 'user', content: formattedPrompt }],
    text: ({ content, done }) => {
      if (done) {
        history.done([...history.get(), { role: 'assistant', content }]);
      }
      return <ChatBubble role="assistant" text={content} className={`mr-auto border-none`} />;
    },
  });

  return {
    id: generateId(),
    role: 'assistant',
    display: result.value,
  };
}

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
