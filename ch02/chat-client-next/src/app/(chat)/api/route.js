import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req) {
  const { text } = await req.json();

  const { data: completion } = await openai.chat.completions
    .create({
      messages: [
        {
          role: 'system',
          content: "I'm happy to assist you in any way I can. How can I be of service today?",
        },
        { role: 'user', content: text },
      ],
      model: 'gpt-3.5-turbo',
      stop: null,
      max_tokens: 150,
    })
    .withResponse();
  const message = {
    id: completion.id, // Include ID
    created: completion.created,
    role: 'assistant',
    content: completion.choices[0].message.content,
  };
  return Response.json({ message });
}
