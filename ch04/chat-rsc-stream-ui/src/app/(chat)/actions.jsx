'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import ChatBubble from '../../components/chat/ChatBubble';
import { generateId } from 'ai';

export async function continueConversation(input) {
  'use server';

  const history = getMutableAIState();
  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    messages: [...history.get(), { role: 'user', content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done([...history.get(), { role: 'assistant', content: input }]);
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
  initialUIState: {
    messages: [],
    isLoading: false
  },
});
