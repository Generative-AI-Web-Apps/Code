'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { z } from 'zod';
import ChatBubble from '../../components/chat/ChatBubble';
import { WeatherCard, LoadingSpinner, fetchWeatherData } from '../../components/Weather';
import { generateId } from 'ai';
import { getSupportedModel } from './utils';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function continueConversation(input, provider, model) {
  'use server';
  const supportedModel = getSupportedModel(provider, model);
  const history = getMutableAIState();
  const result = await streamUI({
    model: supportedModel,
    system: `
    You are a helpful weather assistant. You can provide weather information for cities.
    If a user asks about the weather in a specific city, use the 'getWeather' function to fetch the data.
    Always interpret temperatures in Celsius.
  `,
    messages: [...history.get(), { role: 'user', content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done([...history.get(), { role: 'assistant', content }]);
      }
      return <ChatBubble role="assistant" text={content} className={`mr-auto border-none`} />;
    },
    tools: {
      getWeather: {
        description: 'Get the current weather for a specific city',
        parameters: z.object({
          city: z.string().describe('The name of the city'),
        }),
        generate: async function* ({ city }) {
          yield <LoadingSpinner />;
          await sleep(1000);
          const weatherData = await fetchWeatherData(city);
          return (
            <WeatherCard
              city={city}
              temperature={weatherData.temperature}
              condition={weatherData.condition}
            />
          );
        },
      }
    },
  });

  return {
    id: generateId(),
    role: 'assistant',
    display: result.value,
  };
}

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
