import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
    console.error(`[MCP TOOL] get-number-fact called with number: ${number}`);
    try {
      const response = await fetch(`http://numbersapi.com/${number}`);
      if (!response.ok) {
        console.error(`[MCP TOOL] No fact available for ${number}. Response status: ${response.status}`);
        return {
          content: [{ type: "text", text: `No fact available for ${number}.` }],
        };
      }
      const fact = await response.text();
      console.error(`[MCP TOOL] Fact fetched for ${number}: ${fact}`);
      return { content: [{ type: "text", text: fact }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      console.error(`[MCP TOOL] Error fetching fact for ${number}: ${message}`);
      return {
        content: [{ type: "text", text: `Error fetching fact: ${message}` }],
      };
    }
  }
);

// Optional prompt for summarizing facts
server.prompt(
  "summarize-fact",
  "Summarize a number fact into a short sentence",
  {
    fact: z.string().describe("The fact to summarize"),
  },
  async (args) => {
    const fact = args.fact || "";
    console.error(`[MCP PROMPT] summarize-fact called with fact: ${fact}`);
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You can use the get-number-fact tool to fetch a fact about a number. Here is a fact to summarize:\n"${fact}"`,
          },
        },
      ],
    };
  }
);

// Register documentation resource
server.resource("examples", "examples://numbers", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      text: `# Numbers MCP Server Examples
This server provides tools and prompts for working with numbers. Details...
      `,
    },
  ],
}));

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP SERVER] Numbers MCP Server running on stdio");
}

main().catch((error) => {
  console.error("[MCP SERVER] Fatal error in main():", error);
  process.exit(1);
});
