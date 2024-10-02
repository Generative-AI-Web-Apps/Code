import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import "dotenv/config";
const apiKey = process.env.OPENAI_API_KEY;

const pastMessages = [];
pastMessages.push(new SystemMessage("You are a helpful assistant. Answer all questions to the best of your ability."));
pastMessages.push(new HumanMessage("Hi! I'm Jim."));
pastMessages.push(new AIMessage("Hello Jim! It's nice to meet you. My name is AI. How may I assist you today?"));
pastMessages.push(new HumanMessage("What can you tell me about artificial intelligence?"));
pastMessages.push(new AIMessage("Artificial Intelligence (AI) refers to the simulation of human intelligence in machines."));

const llm = new ChatOpenAI({ apiKey });
const memory = new BufferMemory({
  chatHistory: new ChatMessageHistory(pastMessages),
});

const chain = new ConversationChain({ llm, memory, prompt });
const res1 = await chain.invoke({ input: "Can you give me an example of AI?" });
console.log({ res1 });
/*
Expected Output:
{
  res1: {
    text: "Sure! An example of AI is a virtual assistant like Siri."
  }
}
*/

const res2 = await chain.invoke({ input: "What did I just ask you?" });
console.log({ res2 });
/*
Expected Output:
{
  res2: {
    text: "You just asked for an example of artificial intelligence."
  }
}
*/