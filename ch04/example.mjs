import { z } from "zod";

import { generateObject } from "ai";

const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
});

const ProductListSchema = z.array(ProductSchema);

async function generateProductList(prompt) {
  "use server";

  const {
    object: { products },
  } = await generateObject({
    model: openai("gpt-3.5-turbo"),

    schema: z.object({
      products: ProductListSchema,
    }),

    prompt: `Generate a list of 5 products related to: ${prompt}. Provide name, description, price, and category for each product.`,
  });

  return products;
}

generateProductList("A list of cereal types").then(console.table);
