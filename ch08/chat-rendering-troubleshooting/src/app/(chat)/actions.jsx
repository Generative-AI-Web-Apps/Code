'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';
import { generateId } from 'ai';
import { getSupportedModel } from './utils';
import { logger } from '@/lib/logger'; // Import the logger

export async function continueConversation(input, provider, model) {
  'use server';

  // Log the start of the conversation continuation
  logger.info('Continuing conversation', { input, provider, model });

  const supportedModel = getSupportedModel(provider, model);
  const history = getMutableAIState();

  // Log the supported model
  logger.debug('Supported model determined', { supportedModel });

  try {
    const result = await streamUI({
      model: supportedModel,
      messages: [...history.get(), { role: 'user', content: input }],
      text: ({ content, done }) => {
        if (done) {
          history.done([...history.get(), { role: 'assistant', content }]);
          // Log when the streaming is done
          logger.info('Streaming completed for input', { input });
        }
        return <ChatBubble role="assistant" text={content} className={`mr-auto border-none`} />;
      },
    });

    // Log successful response
    logger.info('Conversation continued successfully', { result });

    return {
      id: generateId(),
      role: 'assistant',
      display: result.value,
    };
  } catch (error) {
    // Log any errors encountered during processing
    logger.error('Error continuing conversation', { error: error.message, input, provider, model });
    throw error; // Re-throw the error after logging it
  }
}

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
