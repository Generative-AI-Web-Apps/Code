// const retrieverChain = RunnableSequence.from([
//   {
//     context: retriever.pipe(formatDocumentsAsString),
//     question: new RunnablePassthrough(),
//   },
//   standaloneQuestionPrompt,
//   llm,
//   new StringOutputParser(),
// ]);
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import "dotenv/config";
const apiKey = process.env.OPENAI_API_KEY;

const text = `Artificial Intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.

As machines become increasingly capable, tasks considered to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI effect. For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology. Similarly, advances in machine learning have led to significant improvements in natural language processing and computer vision.

AI applications include advanced web search engines, recommendation systems, understanding human speech (natural language processing), self-driving cars, and competing at a high level in strategic game systems like chess and Go.`;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 20,
});

const documents = await splitter.createDocuments([text]);
const embeddings = new OpenAIEmbeddings({ apiKey });

const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);

const retriever = vectorStore.asRetriever();

const llm = new ChatOpenAI({ apiKey });

const standaloneQuestionTemplate =
  "Transform the following question into a clear and concise standalone question. Original question: {question} Standalone question:";

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  standaloneQuestionTemplate
);

const answerTemplate = `You are a friendly and knowledgeable assistant specializing in Artificial Intelligence. Based on the provided context, please answer the following question. If the answer is not found in the context, respond with: "I'm sorry, I don't have that information." Always aim for a conversational tone.
Context: {context}
Question: {question}
Answer:`;
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

const standaloneQuestionChain = standaloneQuestionPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

const retrieverChain = RunnableSequence.from([
  (prevResult) => prevResult.standalone_question,
  retriever,
  formatDocumentsAsString,
]);
const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());
const chain = RunnableSequence.from([
  {
    standalone_question: standaloneQuestionChain,
    original_input: new RunnablePassthrough(),
  },
  {
    context: retrieverChain,
    question: ({ original_input }) => original_input.question,
  },
  answerChain,
]);

console.log(
  await chain.invoke({ question: "What is artificial intelligence?" })
);
console.log(
  await chain.invoke({ question: "What is the exact date of the first human landing on Mars?" })
);
