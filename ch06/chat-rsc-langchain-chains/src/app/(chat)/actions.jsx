'use server';

import { createStreamableUI } from 'ai/rsc';
import { RunnableLambda } from '@langchain/core/runnables';
import { generateId } from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getMutableAIState, createAI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';

// Define the prompt template for the chat interaction
const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', "You are a friendly weather assistant. Use the provided weather data to answer the user's query."],
  ['human', "What's the weather like in {city}?"],
  [
    'assistant',
    "Here's the current weather data for {city}:\n" +
      'Temperature: {temperature}\n' +
      'Condition: {condition}\n' +
      'Humidity: {humidity}\n' +
      'Wind Speed: {windSpeed}\n' +
      'How would you like me to interpret this data for you?',
  ],
  [
    'human',
    "Give me a summary of the weather data. Use the provided weather data to answer the user's query. Follow the previous format.",
  ],
]);

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
});

const fetchWeatherData = async (input) => ({
  city: input.city,
  temperature: '75°F',
  condition: 'Sunny',
  humidity: '50%',
  windSpeed: '10 mph',
});

export async function getChainStream(city) {
  const chain = RunnableLambda.from(fetchWeatherData)
                              .pipe(promptTemplate)
                              .pipe(llm)
                              .pipe(new StringOutputParser());

  const stream = await chain.stream({ city });
  return stream;
}

// Function to handle conversation continuation and return multiple UIs
export async function continueConversation(input) {
  const aiState = getMutableAIState();
  const stream = createStreamableUI();

  stream.update(<div>Processing your request...</div>);
  const aiResponseStream = await getChainStream(input);
  let textContent = '';
  for await (const item of aiResponseStream) {
    console.debug('item', item);
    textContent += item;
    stream.update(<ChatBubble role="assistant" text={textContent} className={`mr-auto border-none`} />);
  }
  stream.done();
  aiState.done({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: generateId(),
        role: 'assistant',
        content: textContent,
      },
    ],
  });

  return {
    id: generateId(),
    display: stream.value,
    role: 'assistant',
  };
}

// Create AI instance with actions
export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: { messages: [] },
  initialUIState: [],
});
