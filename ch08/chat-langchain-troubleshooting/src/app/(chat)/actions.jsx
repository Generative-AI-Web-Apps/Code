'use server';

import { createStreamableUI } from 'ai/rsc';
import { generateId } from 'ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getMutableAIState, createAI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';
import { HumanMessage } from '@langchain/core/messages';
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash',
  temperature: 0,
  streaming: true,
});

const tools = [new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
  handleValidationError: (error) => console.error('Search validation error:', error)
})];


const AGENT_SYSTEM_TEMPLATE = `You are a helpful AI assistant specializing in technical queries and web technologies.
When using WikipediaQueryRun for searches:
1. Prioritize authoritative sources and official specifications.
2. Cross-reference information from multiple sources.
3. Format code examples using markdown.

Example interaction:
User: Irish Times
Action: WikipediaQueryRun(search="Irish Times")
Response: The Irish Times is an Irish daily broadsheet... [ details]`;

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