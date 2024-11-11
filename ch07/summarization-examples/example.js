'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import ChatBubble from '../../components/chat/ChatBubble';
import { generateId } from 'ai';
import { prompt } from '../../lib/fewShotPrompt';
import { getSupportedModel } from './utils';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import path from "path";

const VECTOR_STORE_INDEX = "_vector_store_index";

async function loadDocuments(file) {
  const fileExtension = path.extname(file.name).substring(1).toLowerCase();
  const LoaderClass = fileExtension === 'pdf' ? PDFLoader : DocxLoader;

  if (!LoaderClass) {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  const loader = new LoaderClass(file.filepath);
  return loader.load();
}

async function createVectorStore(documents) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const documentChunks = await splitter.splitDocuments(documents);
  return HNSWLib.fromDocuments(
    documentChunks,
    new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GOOGLE_API_KEY })
  );
}

async function saveVectorStore(vectorStore) {
  await vectorStore.save(VECTOR_STORE_INDEX);
}

async function handleDocumentUpload(document) {
    let vectorStore;
  
    console.log("Checking for existing vector store...");
    if (fs.existsSync(VECTOR_STORE_INDEX)) {
      console.log("Loading existing vector store...");
      vectorStore = await HNSWLib.load(VECTOR_STORE_INDEX, new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GOOGLE_API_KEY }));
      console.log("Vector store loaded.");
    } else {
      console.log("Creating new vector store...");
      const documents = await loadDocuments(document);
      
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
      });
  
      const documentChunks = await splitter.splitDocuments(documents);
      vectorStore = await HNSWLib.fromDocuments(
        documentChunks,
        new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GOOGLE_API_KEY })
      );
  
      await vectorStore.save(VECTOR_STORE_INDEX);
      console.log("Vector store created and saved.");
    }
  
    return vectorStore;
  }

export async function continueConversation(input, provider, model, document) {
  'use server';
  
  const supportedModel = getSupportedModel(provider, model);
  const history = getMutableAIState();
  
  if (document) {
    try {
      const vectorStore = await handleDocumentUpload(document);
    } catch (error) {
      console.error("Error processing document:", error);
      return {
        id: generateId(),
        role: 'assistant',
        display: `Failed to process document: ${error.message}`,
      };
    }
  }

  const formattedPrompt = await prompt.format({ input });
  
  const result = await streamUI({
    model: supportedModel,
    messages: [...history.get(), { role: 'user', content: formattedPrompt }],
    text: ({ content, done }) => {
      if (done) {
        history.done([...history.get(), { role: 'assistant', content }]);
      }
      return <ChatBubble role="assistant" text={content} className={`mr-auto border-none`} />;
    },
  });

  return {
    id: generateId(),
    role: 'assistant',
    display: result.value,
  };
}

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});