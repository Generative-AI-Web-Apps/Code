import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { auth } from '@clerk/nextjs/server';
import  { SyncRedactor } from 'redact-pii';

export const dynamic = 'force-dynamic';

const model = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const promptSchema = z.object({
  text: z.string().min(1).max(500, 'Prompt must be between 1 and 500 characters.'),
});

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

const redactor = new SyncRedactor();
function anonymizeText(text) {
  return redactor.redact(text);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const validatedData = promptSchema.parse(body);

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

    const anonymizedInput = anonymizeText(validatedData.text);
    const result = await generateText({
      system: "I'm happy to assist you in any way I can. How can I be of service today?",
      prompt: anonymizedInput,
      model: model('gpt-4o'),
      maxTokens: 512,
    });
    
    const message = {
      id: uuidv4(),
      role: 'assistant',
      content: result.text,
    };

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing prompt:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ errors: error.errors }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to process prompt' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
