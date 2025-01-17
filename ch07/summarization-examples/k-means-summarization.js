import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { loadSummarizationChain } from "langchain/chains";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { kmeans } from 'ml-kmeans';
import { pipeline } from '@huggingface/transformers';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";
const apiKey = process.env.GOOGLE_API_KEY;

const model = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: "gemini-1.5-flash-002",
    streaming: false,
});

const pdfPath = 'docs/tiny-data.pdf';
const loader = new PDFLoader(pdfPath, { parsedItemSeparator: '' });
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 10000,
  chunkOverlap: 250,
});

const allDocs = await splitter.splitDocuments(docs);

async function clusterDocuments(documentChunks, similarityThreshold = 0.8) {
  // Step 1: Compute sentence embeddings using Hugging Face pipeline
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  // Extract embeddings for each chunk
  const chunkEmbeddings = await Promise.all(documentChunks.map((chunk) => extractor(chunk)));

  // Flatten the embeddings array
  const flattenedEmbeddings = chunkEmbeddings.map((embedding) => embedding[0][0].data); // Accessing the data property of the tensor

  // Check number of chunks and determine optimal clusters
  const numChunks = flattenedEmbeddings.length;
  if (numChunks === 0) {
    throw new Error('No document chunks available for clustering.');
  }

  const optimalClusters = Math.max(1, Math.min(Math.ceil(Math.sqrt(numChunks / 2)), numChunks - 1));

  console.log('Number of document chunks:', numChunks);
  console.log('Optimal number of clusters:', optimalClusters);

  // Step 2: Perform K-means clustering
  const kmeansResult = kmeans(flattenedEmbeddings, optimalClusters);

  // Step 3: Merge clusters based on similarity threshold
  const mergedChunks = mergeSimilarClusters(documentChunks, kmeansResult.clusters, similarityThreshold);

  return mergedChunks;
}

// Function to merge similar clusters into coherent chunks
function mergeSimilarClusters(chunks, clusterLabels, similarityThreshold) {
  const mergedChunks = [];
  const clusterMap = {};

  clusterLabels.forEach((label, index) => {
    if (!clusterMap[label]) {
      clusterMap[label] = [];
    }
    clusterMap[label].push(chunks[index]);
  });

  Object.values(clusterMap).forEach((cluster, idx) => {
    const mergedContent = cluster.join(' ');
    const newId = `merged-${idx + 1}`;
    const newDocument = new Document({ pageContent: mergedContent, id: newId });
    mergedChunks.push(newDocument);
  });

  return mergedChunks;
}

// Function to process documents: split and then cluster them
async function processDocuments(documents) {
  const documentChunks = documents.map((doc) => doc.pageContent);
  const clusteredDocuments = await clusterDocuments(documentChunks);
  console.debug('Clustered Documents:', clusteredDocuments);
  return clusteredDocuments;
}

// Example usage
(async () => {
  const clusteredDocs = await processDocuments(allDocs);

  console.log('Clustered Documents:', clusteredDocs);

  const chain = loadSummarizationChain(model, {
    type: 'map_reduce',
    verbose: true,
  });

  const res = await chain.invoke({
    input_documents: clusteredDocs,
  });

  console.log('Summarization Result: ', res);
})();
