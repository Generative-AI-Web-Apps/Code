import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import 'dotenv/config';
const model = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string()
});

const ProductListSchema = z.array(ProductSchema);

async function generateProductList(prompt) {
  const {
    object: { products },
  } = await generateObject({
    model: model('gpt-3.5-turbo'),
    schema: z.object({
      products: ProductListSchema
    }),
    prompt: `Generate a list of 5 products related to: ${prompt}. Provide name, description, price, and category for each product.`,
  });
  return products;
}

generateProductList('A list of cereal types').then(console.table);