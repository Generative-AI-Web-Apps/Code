import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@upstash/redis';
import { auth } from '@clerk/nextjs/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const checkMessageQuota = async (userId) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const key = `message_count:${userId}:${today}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 24 * 60 * 60);
  }

  if (count > 10) {
    return false;
  }

  return true;
};

export const dynamic = 'force-dynamic';

const model = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  const { text } = await req.json();

  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const quotaAvailable = await checkMessageQuota(userId);
  if (!quotaAvailable) {
    return new Response(JSON.stringify({ error: 'Message quota exceeded. You can only send 10 messages per day.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const result = await generateText({
    model: model('models/gemini-2.0-flash'),
    maxTokens: 512,
    messages: [
      {
        role: 'system',
        content: "I'm happy to assist you in any way I can. How can I be of service today?",
      },
      { role: 'user', content: text },
    ],
  });
  const message = {
    id: uuidv4(),
    role: "assistant",
    content: result.text, // Extract content from message
  };
  return Response.json({ message });
}

