import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import "dotenv/config";

// Initialize the Google Generative AI client
const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// Create server instance
const server = new McpServer({
  name: "numbers-mcp",
  version: "1.0.0",
});

// Register number fact tool
server.tool(
  "get-number-fact",
  "Fetch an interesting fact about a number",
  {
    number: z.number().describe("The number to get a fact about"),
  },
  async ({ number }) => {
    try {
      const response = await fetch(`http://numbersapi.com/${number}`);
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `No fact available for ${number}.` }],
        };
      }
      const fact = await response.text();
      return { content: [{ type: "text", text: fact }] };
    } catch (err) {
      // It's good practice to cast the error to access its properties safely
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      return {
        content: [{ type: "text", text: `Error fetching fact: ${message}` }],
      };
    }
  }
);

server.prompt(
  "summarize-fact",
  "Summarize a number fact into a short sentence",
  {
    fact: z.string().describe("The fact to summarize"),
  },
  async (args) => {
    const fact = args.fact || "";

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You can use the get-number-fact tool to fetch a fact about a number. Here is a fact to summarize:\n"${fact}"`
          }
        }
      ]
    };
  }
);

// Register numbers documentation resource
server.resource("examples", "examples://numbers", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      text: `
# Numbers MCP Server Examples

This server provides tools and prompts for working with numbers. Here are some examples:

## Get Number Fact Tool

Get an interesting fact about any number:

\`\`\`
get-number-fact({
  number: 42
})
\`\`\`

\`\`\`
get-number-fact({
  number: 1776
})
\`\`\`

\`\`\`
get-number-fact({
  number: 365
})
\`\`\`

## Summarize Fact Prompt

Summarize a number fact into a shorter sentence:

\`\`\`
summarize-fact({
  fact: "42 is the number of minutes it takes for the average person to fall asleep."
})
\`\`\`

\`\`\`
summarize-fact({
  fact: "1776 is the year the United States Declaration of Independence was signed on July 4th in Philadelphia."
})
\`\`\`

## API Information

- **Base URL**: http://numbersapi.com
- **Supported number types**: integers, dates, years
- **Response format**: Plain text facts
- **Error handling**: Graceful fallbacks for invalid numbers

## Server Details

- **Name**: numbers-mcp
- **Version**: 1.0.0
- **Tools**: get-number-fact
- **Prompts**: summarize-fact
- **Resources**: examples
      `,
    },
  ],
}));

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Numbers MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
