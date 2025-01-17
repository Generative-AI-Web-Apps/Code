import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; // Importing Google Generative AI embeddings
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
const VECTOR_STORE_INDEX = "_vector_store_index";

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
  
  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: 'text-embedding-005' }); // Model used for saving
  return HNSWLib.fromDocuments(
    documentChunks,
    embeddings
  );
};

const loadVectorStoreWithDifferentEmbeddings = async () => {
  const differentEmbeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: 'text-embedding-004' }); // Different model used for loading
  const vectorStore = await HNSWLib.load(VECTOR_STORE_INDEX, differentEmbeddings);
  
  const results = await vectorStore.similaritySearch('example query', 5);
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

// Start processing files in the 'docs' directory
processDirectory("docs").then(() => {
  console.log("DONE!");
  loadVectorStoreWithDifferentEmbeddings();
});

