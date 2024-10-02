import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
  const { text } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: text }],
      },
      {
        role: "model",
        parts: [{ text: "I'm happy to assist you in any way I can. How can I be of service today?" }],
      },
    ],
  });

  let result = await chat.sendMessage(text);
  const responseMessage = result.response.text();

  const message = {
    id: uuidv4(),
    created: new Date(),
    role: 'assistant',
    content: responseMessage,
  };

  return new Response(JSON.stringify({ message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}