'use server';
import { z } from 'zod';
import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import ChatBubble from '../../components/chat/ChatBubble';
import { generateId, generateObject } from 'ai';
import { getSupportedModel } from './utils';

const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
});
const ProductListSchema = z.array(ProductSchema);

export async function continueConversation(input, provider, model) {
  'use server';
  const supportedModel = getSupportedModel(provider, model);
  const history = getMutableAIState();
  const result = await streamUI({
    model: supportedModel,
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

export async function generateProductList(prompt) {
  'use server';
  const {
    object: { products },
  } = await generateObject({
    model: openai('gpt-3.5-turbo'),
    schema: z.object({
      products: ProductListSchema,
    }),
    prompt: `Generate a list of 5 products related to: ${prompt}. Provide name, description, price, and category for each product.`,
  });
  return products;
}

export const AI = createAI({
  actions: {
    generateProductList,
  },
  initialAIState: [],
  initialUIState: [],
});
