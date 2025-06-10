import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const model = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || '',
});

export async function POST(req) {
  try {
    const { text } = await req.json();
    const result = await generateText({
      system: "I'm happy to assist you in any way I can. How can I be of service today?",
      prompt: text,
      model: model('gemini-2.0-flash'),
      maxTokens: 512,
    });
    const message = {
      id: uuidv4(),
      role: "assistant",
      content: result.text,
    };

    return Response.json({ message });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}