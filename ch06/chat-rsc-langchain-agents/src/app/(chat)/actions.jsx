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
  new MessagesPlaceholder('messages'),
  new MessagesPlaceholder('agent_scratchpad'),
]);


const agent = createReactAgent({
  llm: model,
  tools,
  prompt,
});

const validateInput = (input) => {
  if (!input?.trim() || input.length > 2000) {
    throw new Error('Invalid input - must be non-empty string under 2000 characters');
  }
};

export async function continueConversation(input) {
  const aiState = getMutableAIState();
  const stream = createStreamableUI(
    <ChatBubble 
      role="assistant" 
      text="Processing your request..." 
      className="mr-auto border-none"
    />
  );

  try {
    validateInput(input);
    const aiResponseStream = await agent.stream(
      { messages: [new HumanMessage(input)] },
      { streamMode: 'values' }
    );

    let textContent = '';
    let isSearching = false;

    for await (const { messages } of aiResponseStream) {
      const msg = messages[messages.length - 1];
      
      if (msg?.additional_kwargs?.tool_calls) {
        isSearching = true;
        stream.update(
          <ChatBubble 
            role="assistant" 
            text="Searching for information..." 
            className="mr-auto border-none italic"
          />
        );
      } else if (msg?.content) {
        textContent += msg.content;
        stream.update(
          <ChatBubble 
            role="assistant" 
            text={textContent} 
            className="mr-auto border-none"
          />
        );
      }
    }

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

  } catch (error) {
    console.error('Processing error:', error);
    stream.update(
      <ChatBubble
        role="assistant"
        text="Error processing request. Please check your input and try again."
        className="mr-auto border-none text-red-500"
      />
    );
  } finally {
    stream.done();
  }

  return {
    id: generateId(),
    display: stream.value,
    role: 'assistant',
  };
}

export const AI = createAI({
  actions: { continueConversation },
  initialAIState: { messages: [] },
  initialUIState: [],
});