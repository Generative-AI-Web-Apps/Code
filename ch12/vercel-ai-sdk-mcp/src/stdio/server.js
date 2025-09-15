import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'numbers',
  version: '1.0.0',
});

// Tool: get-number-fact
server.tool(
  'get-number-fact',
  'Get an interesting fact about a number',
  {
    number: z.number(),
  },
  async ({ number }) => {
    try {
      const response = await fetch(`http://numbersapi.com/${number}`);
      if (!response.ok) {
        return { content: [{ type: 'text', text: `Failed to retrieve a fact for ${number}` }] };
      }

      const fact = await response.text();

      return { content: [{ type: 'text', text: fact }] };
    } catch (error) {
      console.error('[ERROR] Failed to fetch number fact:', error);
      return { content: [{ type: 'text', text: `Error fetching fact for ${number}` }] };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Numbers MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
