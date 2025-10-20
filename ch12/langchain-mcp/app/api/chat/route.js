import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { generateUniqueId } from "@/lib/generateUniqueId";

async function normalizeUserMessage(rawMessage) {
  if (rawMessage.parts?.length) {
    return rawMessage.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join(" ");
  }
  if (Array.isArray(rawMessage.content)) {
    return rawMessage.content
      .map((c) => (c.text ? c.text : ""))
      .filter(Boolean)
      .join(" ");
  }
  return rawMessage.content;
}

async function createMCPClient() {
  console.log("[DEBUG] Creating MCP client...");
  const client = new MultiServerMCPClient({
    useStandardContentBlocks: true,
    mcpServers: {
      norris: {
        transport: "stdio",
        command: "node",
        args: ["app/stdio/server.js"],
        restart: { enabled: true, maxAttempts: 3, delayMs: 1000 },
      },
    },
  });

  const tools = await client.getTools();
  console.log("[DEBUG] MCP client initialized with tools:", tools.map(t => t.name));
  return { client, tools };
}

function createModel() {
  console.log("[DEBUG] Creating Google Gemini model...");
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GEMINI_API_KEY,
  });
}

async function invokeAgent(agent, humanMessage) {
  console.log("[DEBUG] Invoking agent with message:", humanMessage.text);
  const result = await agent.invoke({ messages: [humanMessage] });
  console.log("[DEBUG] Agent returned messages:", result.messages);
  return result.messages.filter((m) => m.type !== "HumanMessage" && m.type !== "ToolMessage").pop();
}

function streamMessages(normalizedMessage, aiMessage) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const userId = generateUniqueId();
      console.log("[STREAM] User message:", userId, normalizedMessage);
      writer.write({
        type: "data-norris-fact",
        data: { content: normalizedMessage },
        id: userId,
      });

      if (!aiMessage) {
        console.log("[STREAM] No AI message returned.");
        return;
      }

      let aiContent = "";
      if (typeof aiMessage.content === "string") {
        aiContent = aiMessage.content;
      } else if (Array.isArray(aiMessage.content)) {
        aiContent = aiMessage.content
          .map((c) => (c.text ? c.text : ""))
          .filter(Boolean)
          .join(" ");
      }

      const aiId = generateUniqueId();
      console.log("[STREAM] AI message:", aiId, aiContent);
      writer.write({
        type: "data-norris-fact",
        data: { content: aiContent },
        id: aiId,
      });

      if (aiMessage.name) {
        console.log("[STREAM] Tool used by AI:", aiMessage.name);
        writer.write({
          type: "data-notification",
          data: { message: `Tool used: ${aiMessage.name}`, level: "info" },
          transient: true,
        });
      }
    },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const rawMessages =
      body.messages || (body.input ? [{ role: "user", content: String(body.input) }] : []);

    if (!rawMessages.length) {
      console.warn("[DEBUG] No messages provided in request.");
      return new Response(JSON.stringify({ error: "No messages provided." }), { status: 400 });
    }

    const lastRawMessage = rawMessages[rawMessages.length - 1];
    const normalizedMessage = await normalizeUserMessage(lastRawMessage);
    console.log("[DEBUG] Normalized user message:", normalizedMessage);

    const humanMessage = new HumanMessage(normalizedMessage);

    const { client, tools } = await createMCPClient();
    const model = createModel();
    const agent = createReactAgent({ llm: model, tools });

    const aiMessage = await invokeAgent(agent, humanMessage);
    console.log("[DEBUG] AI message processed:", aiMessage);

    await client.close();

    const uiStream = streamMessages(normalizedMessage, aiMessage);
    return createUIMessageStreamResponse({ stream: uiStream });
  } catch (err) {
    console.error("[ERROR] /api/chat failed:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
