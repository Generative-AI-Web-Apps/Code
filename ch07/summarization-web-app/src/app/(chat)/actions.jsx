'use server';

import { generateId } from 'ai';
import ChatBubble from '../../components/chat/ChatBubble';
import { getMutableAIState, createAI } from 'ai/rsc';
import { loadSummarizationChain } from "langchain/chains";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from '@langchain/core/prompts';
const apiKey = process.env.GOOGLE_API_KEY;

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  apiKey: apiKey,
  model: "gemini-1.5-flash-002",
  streaming: false,
});

// Function to normalize documents
const normalizeDocuments = (docs) => {
  return docs.map(doc => ({
    ...doc,
    pageContent: doc.pageContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  }));
};

// Function to handle file processing
const processFile = async (fileBlob, fileType) => {
  let loader;
  
  if (fileType === 'application/pdf') {
    loader = new PDFLoader(fileBlob);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    loader = new DocxLoader(fileBlob);
  } else {
    throw new Error('Unsupported file type');
  }

  const docs = await loader.load();
  return summarizeDocs(docs);
};

const summarizeDocs = async (docs) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments(normalizeDocuments(docs));
  
  // Load and run the summarization chain
  const chain = loadSummarizationChain(model, {
    type: "map_reduce",
    verbose: true,
  });

  const result = await chain.invoke({
    input_documents: splitDocs,
  });

  return result.text;
}

// Function to handle text summarization
const summarizeText = async (text) => {
  return summarizeDocs([text]);
};

// Main function to handle conversation continuation
export async function continueConversation(input) {
  const aiState = getMutableAIState();

  try {
    let summary;
    if (input instanceof FormData) {
      const file = input.get('file');
      summary = await processFile(file, file.type);
    } else {
      summary = await summarizeText(input);
    }

    const message = {
      id: generateId(),
      role: 'assistant',
      content: summary,
    };

    aiState.done({
      ...aiState.get(),
      messages: [...aiState.get().messages, message],
    });

    return {
      id: generateId(),
      display: <ChatBubble role="assistant" text={summary} className="mr-auto border-none" />,
      role: 'assistant',
    };

  } catch (error) {
    console.error('Error in continueConversation:', error);
    const errorMessage = `An error occurred: ${error.message}`;
    
    return {
      id: generateId(),
      display: <ChatBubble role="assistant" text={errorMessage} className="mr-auto border-none text-red-500" />,
      role: 'assistant',
    };
  }
}

// Create AI instance with actions
export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: { messages: [] },
  initialUIState: [],
});