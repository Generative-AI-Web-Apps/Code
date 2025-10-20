import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server instance
const server = new McpServer({
  name: "chuck-norris-mcp",
  version: "1.0.0",
});

// Register joke tool
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chuck Norris MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
