'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { z } from 'zod';
import ChatBubble from '../../components/chat/ChatBubble';
import { WeatherCard, LoadingSpinner, fetchWeatherData } from '../../components/Weather';
import { generateId } from 'ai';
import { getSupportedModel } from './utils';

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
    getWeather: {
      // #C: Description of the tool for the AI to understand its purpose
      description: 'Get the current weather for a specific city',

      // #D: Definition of the parameters the tool expects, using Zod for validation
      parameters: z.object({
        city: z.string().describe('The name of the city'),
      }),

      // #E: Async generator function that produces the tool's output
      generate: async function* ({ city }) {
        // Immediately yield a loading indicator
        yield <LoadingSpinner />;

        // Simulating API call
        await sleep(1000);
        const weatherData = await fetchWeatherData(city);

        // Return a WeatherCard component with the fetched data
        return <WeatherCard city={city} temperature={weatherData.temperature} condition={weatherData.condition} />;
      },
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
