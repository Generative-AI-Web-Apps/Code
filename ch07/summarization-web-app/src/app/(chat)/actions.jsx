'use server';

import { generateId } from 'ai';
import ChatBubble from '../../components/chat/ChatBubble';
import { getMutableAIState, createAI } from 'ai/rsc';
import { loadSummarizationChain } from "langchain/chains";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";

const apiKey = process.env.GEMINI_API_KEY;

const model = new ChatGoogleGenerativeAI({
  apiKey: apiKey,
  model: "gemini-2.5-flash",
  streaming: false,
});

const normalizeDocuments = (docs) => {
  return docs.map(doc => ({
    ...doc,
    pageContent: doc.pageContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  }));
};

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
    chunkSize: 10000,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments(normalizeDocuments(docs));

  const chain = loadSummarizationChain(model, {
    type: "map_reduce",
    verbose: true,
    returnIntermediateSteps: false,
  });

  const result = await chain.invoke({
    input_documents: splitDocs,
  });

  return result.text;
}

// Function to handle text summarization
const summarizeText = async (text) => {
  const doc = new Document({ pageContent: text });
  return summarizeDocs([doc]);
};

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

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: { messages: [] },
  initialUIState: [],
});