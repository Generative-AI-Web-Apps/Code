import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; // Import for Google AI
import "dotenv/config";

const apiKey = process.env.GOOGLE_API_KEY; // Google API key

const toUpperCase = (input) => {
  return {
    uppercased: input.text.toUpperCase(),
  };
};

const vowelCountFunction = (input) => {
  const vowels = input.uppercased.match(/[AEIOU]/gi);
  return {
    vowelCount: vowels ? vowels.length : 0,
  };
};

const model = new ChatGoogleGenerativeAI({
  apiKey,
  model: "gemini-1.5-flash-002",
});

const prompt = ChatPromptTemplate.fromTemplate(
  "Print this number twice: {vowelCount}"
);

const chain = RunnableLambda.from(toUpperCase)
  .pipe(RunnableLambda.from(vowelCountFunction))
  .pipe(prompt)
  .pipe(model)
  .pipe(new StringOutputParser());

await chain.invoke({ text: "hello world" }).then((output) => {
  console.log(output);
});
