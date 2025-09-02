import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const model = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req) {
  try {
    console.log('Received request');

    const { text } = await req.json();
    console.log('Request body:', text);

    if (!text) {
      console.warn('No text provided in request body');
      return new Response("Bad Request: 'text' is required", { status: 400 });
    }

    const result = await generateText({
      system: "I'm happy to assist you in any way I can. How can I be of service today?",
      prompt: text,
      model: model('gemini-2.5-flash'),
      maxTokens: 512,
    });

    console.log('AI result:', result);

    const message = {
      id: uuidv4(),
      role: "assistant",
      content: result.text,
    };

    console.log('Returning message:', message);

    return Response.json({ message });
  } catch (error) {
    console.error('Error occurred in POST handler:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
