"use client";

import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import ChuckNorrisFactCard from "@/components/ChuckNorrisFactCard";

function getMessageContent(msg) {
  if (!msg.parts) return "";

  if (msg.role === "user") {
    return msg.parts.map((p) => p.text).filter(Boolean).join("\n");
  }

  return msg.parts
    .filter((p) => p.type === "data-norris-fact" && !p.id.endsWith("-user"))
    .map((p) => p.data?.content)
    .filter(Boolean)
    .join("\n");
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onData: (dataPart) => {
      if (dataPart.type === "data-norris-fact") {
        console.trace("norris fact:", dataPart.data);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4 space-y-4 h-screen">
      <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            "Ask for a Chuck Norris Fact or Joke!"
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const content = getMessageContent(msg);

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-lg max-w-[80%] bg-blue-500 text-white ml-auto"
              >
                <div className="text-sm font-medium mb-1 text-blue-100">You</div>
                <div className="whitespace-pre-wrap">{content}</div>
              </div>
            );
          }

          return content ? (
            <ChuckNorrisFactCard key={msg.id} fact={content} />
          ) : (
            <div
              key={msg.id}
              className="p-3 rounded-lg max-w-[80%] bg-white border shadow-sm"
            >
              <div className="text-sm font-medium mb-1 text-gray-600">AI / Tool</div>
              <div className="whitespace-pre-wrap">{content}</div>
            </div>
          );
        })}

        {isLoading && (
          <div className="bg-white border shadow-sm p-3 rounded-lg max-w-[80%]">
            <div className="text-sm font-medium mb-1 text-gray-600">AI</div>
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a Chuck Norris joke or question..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
