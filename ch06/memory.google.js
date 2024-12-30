import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; // Import for Google AI
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import "dotenv/config";

const apiKey = process.env.GOOGLE_API_KEY; // Google API key

const pastMessages = [];
pastMessages.push(
  new SystemMessage(
    "You are a helpful assistant. Answer all questions to the best of your ability."
  )
);
pastMessages.push(new HumanMessage("Hi! I'm Jim."));
pastMessages.push(
  new AIMessage(
    "Hello Jim! It's nice to meet you. My name is AI. How may I assist you today?"
  )
);
pastMessages.push(
  new HumanMessage("What can you tell me about artificial intelligence?")
);
pastMessages.push(
  new AIMessage(
    "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines."
  )
);

const llm = new ChatGoogleGenerativeAI({ apiKey });
const memory = new BufferMemory({
  chatHistory: new ChatMessageHistory(pastMessages),
});

const chain = new ConversationChain({ llm, memory });
const res1 = await chain.invoke({ input: "Can you give me an example of AI?" });
console.log({ res1 });
/*
Expected Output:
{
  res1: {
    text: "Sure! An example of AI is a virtual assistant like Google Assistant."
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
