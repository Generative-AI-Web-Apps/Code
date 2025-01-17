'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';
import { generateId } from 'ai';
import { logger } from '@/lib/logger';
import { AIErrorTracker } from '@/lib/error-tracking';
import { createFallback } from 'ai-fallback';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
const openAPIKey = process.env.OPENAI_API_KEY;
const googleAPIKey = process.env.GOOGLE_API_KEY;

const retryableStatusCodes = [429, 500];

const supportedModel = createFallback({
  models: [
    createGoogleGenerativeAI({ apiKey: googleAPIKey })('models/gemini-1.5-pro-001'),
    createOpenAI({ apiKey: openAPIKey })('gpt-3.5-turbo'),
  ],
  onError: (error, modelId) => {
    logger.error(`Error with model ${modelId}:`, error);
  },
  modelResetInterval: 60000,
  shouldRetryThisError: (error) => {
    retryableStatusCodes.includes(error.statusCode)
  }
});

export async function continueConversation(input, provider, model) {
  logger.info('Continuing conversation', { input, provider, model });

  const history = getMutableAIState();
  console.debug(history.get());
  try {
    const result = await streamUI({
      model: supportedModel,
      maxTokens: 4096,
      maxRetries: 3,
      messages: [...history.get(), { role: 'user', content: input }],
      text: ({ content, done }) => {
        if (done) {
          history.done([...history.get(), { role: 'assistant', content }]);
          logger.info('Streaming completed for input', { input });
        }
        return <ChatBubble role="assistant" text={content} className="mr-auto border-none" />;
      },
    });

    logger.info('Conversation continued successfully', { result });
    
    return {
      id: generateId(),
      role: 'assistant',
      display: result.value,
    };
  } catch (error) {
    logger.error('Error continuing conversation', { error: error.message, input });
    
    const errorData = await AIErrorTracker.trackError(error, {
      provider,
      model,
      input,
    });

    const userError = AIErrorTracker.createUserFacingError(errorData);
    
    return {
      id: userError.requestId,
      role: 'assistant',
      display: (
        <ChatBubble
          role="error"
          text={`${userError.message} (Request ID: ${userError.requestId})`}
          className="mr-auto border-none error"
        />
      ),
    };
  }
}

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});