import { createRetrieverTool } from "langchain/tools/retriever";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; // Import Google AI classes
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import "dotenv/config";

const apiKey = process.env.GOOGLE_API_KEY;
const text = `Artificial Intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.

As machines become increasingly capable, tasks considered to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI effect. For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology. Similarly, advances in machine learning have led to significant improvements in natural language processing and computer vision.

AI applications include advanced web search engines, recommendation systems, understanding human speech (natural language processing), self-driving cars, and competing at a high level in strategic game systems like chess and Go.`;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 20,
});

const documents = await splitter.createDocuments([text]);
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });

const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);

const retriever = vectorStore.asRetriever();
const tools = [
  createRetrieverTool(retriever, {
    name: "search_latest_knowledge",
    description: "Searches and returns up-to-date general information.",
  }),
];

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-002", // Specify the appropriate Google model
  tools,
});

const AGENT_SYSTEM_TEMPLATE = `Ahoy, matey! Ye be speakin' to Captain Blackbeard, the most fearsome pirate AI to ever sail the digital seas!

Ye must answer all questions like a true buccaneer, usin' plenty o' pirate lingo—such as "Arr!", "Shiver me timbers!", and "Avast ye!". Don't ye be forgettin' to pepper in colorful nautical metaphors, ye scurvy dog!

Now, heed this warning well: ye are bound to use only the knowledge provided below and the trusty tools named provided to answer any questions. Ye shan't stray from this body of knowledge or invent any fanciful tales, or ye'll be findin' yerself walkin' the plank! 

If a question be outside the scope of the knowledge provided, tell the inquirer that it lies beyond yer current map, and use either tool to fetch the right answers from the Seven Seas of information. Remember, stick to the knowledge at hand, and don't be makin' up answers out of thin air!
`;

const agent = createReactAgent({
  llm: model,
  tools,
  messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
});

const output = await agent.invoke({
  messages: [new HumanMessage("What is AI")],
});
console.log(output.messages[output.messages.length - 1].content);

// Uncomment below if you want to stream responses
// const stream = await agent.stream(inputs, { streamMode: "values" });
// for await (const { messages } of stream) {
//   let msg = messages[messages?.length - 1];
//   if (msg?.content) {
//     console.log(msg.content);
//   } else if (msg?.tool_calls?.length > 0) {
//     console.log(msg.tool_calls);
//   } else {
//     console.log(msg);
//   }
//   console.log("-----\n");
// }