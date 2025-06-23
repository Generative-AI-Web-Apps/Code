
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const model = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const promptSchema = z.object({
  text: z.string().min(1).max(500, "Prompt must be between 1 and 500 characters."),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const validatedData = promptSchema.parse(body);

    const result = await generateText({
      system: "I'm happy to assist you in any way I can. How can I be of service today?",
      prompt: validatedData.text,
      model: model('gpt-4o'),
      maxTokens: 512,
    });
    const message = {
      id: uuidv4(),
      role: result.response.messages[0].role,
      content: result.text,
    };

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Error processing prompt:", error);

    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      return new Response(JSON.stringify({ errors: error.errors }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Handle other unexpected errors
    return new Response(JSON.stringify({ error: "Failed to process prompt" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}