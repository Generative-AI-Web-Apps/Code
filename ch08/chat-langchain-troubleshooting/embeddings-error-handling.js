import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const DOCS_DIRECTORY = path.join(SCRIPT_DIR, 'docs');
const VECTOR_STORE_INDEX = path.join(SCRIPT_DIR, '_vector_store_index');

const loaders = {
  pdf: PDFLoader,
  docx: DocxLoader,
};

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

const saveVectorStore = async (vectorStore) => {
  await vectorStore.save(VECTOR_STORE_INDEX);
};

const createVectorStore = async (documents) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const documentChunks = await splitter.splitDocuments(documents);

  // This model is used for CREATION/SAVING
  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: 'gemini-embedding-exp-03-07' });

  return HNSWLib.fromDocuments(
    documentChunks,
    embeddings
  );
};

const loadVectorStoreWithDifferentEmbeddings = async () => {
  // This DIFFERENT model is used for LOADING/QUERYING, causing the mismatch error
  const differentEmbeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: 'models/embedding-001' });

  const vectorStore = await HNSWLib.load(VECTOR_STORE_INDEX, differentEmbeddings);

  const results = await vectorStore.similaritySearch('example query', 5);
  console.log("Results from vector store with different embeddings:", results);
};

const processFile = async (filePath) => {
  try {
    const documents = await loadDocumentsFromFile(filePath);
    if (!documents) return;

    const vectorStore = await createVectorStore(documents);
    await saveVectorStore(vectorStore);

    console.log(`Processed and saved vector store for file: ${filePath}`);
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
};

const processDirectory = async (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory not found: ${directoryPath}. Please ensure the 'docs' folder exists next to your script.`);
    return;
  }

  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      await processFile(filePath);
    } else if (stats.isDirectory()) {
      await processDirectory(filePath);
    }
  }
};

processDirectory(DOCS_DIRECTORY).then(() => {
  console.log("DONE!");
  // This call will now trigger the dimension mismatch error
  loadVectorStoreWithDifferentEmbeddings();
});