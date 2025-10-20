import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "chuck-norris-mcp",
  version: "1.0.0",
});

// Tool: Fetch a random joke
server.tool(
  "get-chuck-joke",
  "Fetch a random Chuck Norris joke",
  {},
  async () => {
    try {
      const response = await fetch("https://api.chucknorris.io/jokes/random");
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `No joke available at the moment.` }],
        };
      }
      const data = await response.json();
      return { content: [{ type: "text", text: data.value }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      return { content: [{ type: "text", text: `Error fetching joke: ${message}` }] };
    }
  }
);

// Tool: Fetch a random joke from a specific category
server.tool(
  "get-chuck-joke-category",
  "Fetch a random Chuck Norris joke from a given category",
  {
    category: z.string().describe("The joke category to fetch"),
  },
  async ({ category }) => {
    try {
      const response = await fetch(`https://api.chucknorris.io/jokes/random?category=${category}`);
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `No joke available for category "${category}".` }],
        };
      }
      const data = await response.json();
      return { content: [{ type: "text", text: data.value }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      return { content: [{ type: "text", text: `Error fetching joke: ${message}` }] };
    }
  }
);

// Tool: List available joke categories
server.tool(
  "list-joke-categories",
  "Get a list of available Chuck Norris joke categories",
  {},
  async () => {
    try {
      const response = await fetch("https://api.chucknorris.io/jokes/categories");
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `Could not fetch categories.` }],
        };
      }
      const categories = await response.json();
      return { content: [{ type: "text", text: categories.join(", ") }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      return { content: [{ type: "text", text: `Error fetching categories: ${message}` }] };
    }
  }
);

// Prompt: Summarize a joke
server.prompt(
  "summarize-joke",
  "Summarize a Chuck Norris joke into a short sentence",
  {
    joke: z.string().describe("The joke to summarize"),
  },
  async (args) => {
    const joke = args.joke || "";
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You can use the get-chuck-joke or get-chuck-joke-category tools to fetch jokes. Here is a joke to summarize:\n"${joke}"`
          }
        }
      ]
    };
  }
);

// Register documentation resource
server.resource("examples", "examples://chuck-norris", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      text: `
# Chuck Norris MCP Server Examples

## Tools

- **get-chuck-joke()**: Fetch a random joke.
- **get-chuck-joke-category({ category })**: Fetch a random joke from a category.
- **list-joke-categories()**: List all available joke categories.

## Prompt

- **summarize-joke({ joke })**: Summarize a joke into a shorter sentence.

## Examples

\`\`\`
get-chuck-joke()
\`\`\`

\`\`\`
list-joke-categories()
\`\`\`

\`\`\`
get-chuck-joke-category({ category: "science" })
\`\`\`

\`\`\`
summarize-joke({ joke: "Chuck Norris counted to infinity. Twice." })
\`\`\`
      `,
    },
  ],
}));

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chuck Norris MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
