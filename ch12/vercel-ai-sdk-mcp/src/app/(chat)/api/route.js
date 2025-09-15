import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages, experimental_createMCPClient } from 'ai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';

export const maxDuration = 30;

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req) {
  const { messages } = await req.json();

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/stdio/server.js'],
  });

  const mcpClient = await experimental_createMCPClient({ transport });
  const tools = await mcpClient.tools();

  const result = streamText({
    model: gemini('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    tools,
    system: 'You are a helpful assistant that can call tools when needed.',
    onFinish: async () => {
      await mcpClient.close();
    },
    onError: async () => {
      await mcpClient.close();
    },
  });
  return result.toUIMessageStreamResponse();
}
