import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
const model = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

const result = await generateText({
  model: model('models/gemini-2.0-flash'),
  maxTokens: 512,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'what are the red things in this image?',
        },
        {
          type: 'image',
          image: new URL(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2024_Solar_Eclipse_Prominences.jpg/720px-2024_Solar_Eclipse_Prominences.jpg',
          ),
        },
      ],
    },
  ],
});

console.log(result);