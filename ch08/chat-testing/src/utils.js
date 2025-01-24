import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from 'path';

const supportedProviders = {
  openai: {
    constructor: createOpenAI,
    models: ['gpt-3.5-turbo', 'gpt-4'],
  },
  google: {
    constructor: createGoogleGenerativeAI,
    models: ['models/gemini-1.5-pro-latest'],
  },
};

export function getSupportedModel(provider, model) {
  const providerConfig = supportedProviders[provider];

  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const { constructor, models } = providerConfig;

  if (!models.includes(model)) {
    throw new Error(`Unsupported model: ${model} for provider: ${provider}`);
  }

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  const providerInstance = constructor({ apiKey });

  return providerInstance(model);
}

const loadDocumentsFromFile = async (filePath) => {
  const fileExtension = path.extname(filePath).substring(1).toLowerCase();
  const LoaderClass = loaders[fileExtension];

  if (!LoaderClass) {
    console.error(`No loader found for file extension: ${fileExtension}`);
    return null;
  }

  const loader = new LoaderClass(filePath);
  return loader.load();
};

const createVectorStore = async (documents) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const documentChunks = await splitter.splitDocuments(documents);
  return HNSWLib.fromDocuments(documentChunks, new GoogleGenerativeAIEmbeddings({ apiKey }));
};

export const saveVectorStore = async (vectorStore) => {
  await vectorStore.save(VECTOR_STORE_INDEX);
};

import { Buffer } from 'buffer'; 

export const processFile = async (file) => {
  try {
    let documents;

    if (file instanceof Blob) {
      const buffer = await file.arrayBuffer();
      const text = Buffer.from(buffer).toString('utf-8');
    
      documents = parseDocumentsFromText(text);
    } else if (typeof file === 'string') {
      documents = await loadDocumentsFromFile(file);
    } else {
      throw new Error('Unsupported file type');
    }

    console.log(documents);
    if (!documents) return;

    const vectorStore = await createVectorStore(documents);
    await saveVectorStore(vectorStore);

    console.log(`Processed and saved vector store for file: ${file}`);
  } catch (error) {
    console.error(`Error processing file: ${file}`, error);
  }
};

const parseDocumentsFromText = (text) => {
  return [{ pageContent: text }];
};