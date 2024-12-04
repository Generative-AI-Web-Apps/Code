import { loadSummarizationChain } from "langchain/chains";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";
import TokenTracker from "./TokenTracker.js";

const apiKey = process.env.GOOGLE_API_KEY;

const pdfPath = "docs/tiny-data.pdf";
const loader = new PDFLoader(pdfPath, { parsedItemSeparator: "" });

const docs = await loader.load();

const splitter = new TokenTextSplitter({
  chunkSize: 10000,
  chunkOverlap: 250,
});

const docsSummary = await splitter.splitDocuments(normalizeDocuments(docs));


const tokenTracker = new TokenTracker();
const model = new ChatGoogleGenerativeAI({
  apiKey: apiKey,
  model: "gemini-1.5-flash-002",
  streaming: false,
  callbacks: [
    {
      handleLLMEnd: (output) => {
        const { message } = output.generations[0][0];
        tokenTracker.updateTokens(message.usage_metadata);
        console.log('Current Token Usage:', tokenTracker.getCurrentUsage());
        console.log('Token Differences:', tokenTracker.getTokenDiff());
      },
    },
  ],
});

// Load the summarization chain
const chain = loadSummarizationChain(model, {
  type: "map_reduce",
  verbose: true,
});

// Call the summarization chain
const res = await chain.invoke({
  input_documents: docsSummary,
});

console.log("Summarization Result: ", res);

function normalizeDocuments(docs) {
  return docs.map((doc) => {
    let pageContent;

    // Normalize the content based on its type
    if (typeof doc.pageContent === "string") {
      pageContent = doc.pageContent;
    } else if (Array.isArray(doc.pageContent)) {
      pageContent = doc.pageContent.join("\n");
    }
    // Perform cleanup operations on the page content
    if (pageContent) {

      // Trim whitespace
      pageContent = pageContent.trim();

      // Remove unwanted characters (e.g., figure references)
      pageContent = pageContent.replace(/Figure \d+:.*?\n/g, '').replace(/−\d+\n/g, '');

      // Normalize spaces
      pageContent = pageContent.replace(/\s+/g, ' ');
      pageContent = pageContent.replace(/(\s*l\s*){2,}/g, ' ');

      // Filter out non-content lines (example)
      const filteredDocument = pageContent.split('\n').filter(line => 
        !line.includes('References') && !line.includes('Acknowledgments')
      )[0];
      doc.pageContent = filteredDocument;
      return doc;
    }

    return null; 
  }).filter(doc => doc !== null && doc.pageContent != []); // Filter out any null entries from the result
}
