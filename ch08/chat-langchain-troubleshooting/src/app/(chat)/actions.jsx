'use server';

import { createStreamableUI } from 'ai/rsc';
import { generateId } from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { getMutableAIState, createAI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';
import { HumanMessage } from '@langchain/core/messages';
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  streaming: true,
});

const tools = [new DuckDuckGoSearch({ maxResults: 1 })];

const AGENT_SYSTEM_TEMPLATE = `You are a helpful AI assistant that can answer questions about current events and general knowledge. You have access to the DuckDuckGo search engine to find up-to-date information.

To use the search tool, you can call it like this:
Action: DuckDuckGoSearch

Always strive to provide accurate and helpful information. If you're unsure about something, it's okay to say so.`;

const prompt = ChatPromptTemplate.fromMessages([
  ['system', AGENT_SYSTEM_TEMPLATE],
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

const agent = createReactAgent({
  llm: model,
  tools,
  prompt,
});

export async function getAgentStream(input) {
  const stream = await agent.stream(
    {
      messages: [new HumanMessage(input)],
    },
    { streamMode: 'values' },
  );
  return stream;
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function continueConversation(input) {
  const aiState = getMutableAIState();
  const stream = createStreamableUI(
    <ChatBubble role="assistant" text="Processing your request..." className={`mr-auto border-none`} />,
  );

  const aiResponseStream = await getAgentStream(input);
  let textContent = '';
  let isSearching = false;
  for await (const { messages } of aiResponseStream) {
    let msg = messages[messages?.length - 1];
    console.debug('msg', msg);

    if (msg?.additional_kwargs?.tool_calls && !isSearching) {
      isSearching = true;
      stream.update(
        <ChatBubble role="assistant" text="Searching for information..." className={`mr-auto border-none italic`} />,
      );
      await delay(2000)
    } else if (msg?.content && msg.constructor.name === 'AIMessageChunk') {
      if (isSearching) {
        textContent = "Here's what I found:\n\n";
        isSearching = false;
      }
      textContent += msg.content;
      stream.update(<ChatBubble role="assistant" text={textContent} className={`mr-auto border-none`} />);
    }
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
