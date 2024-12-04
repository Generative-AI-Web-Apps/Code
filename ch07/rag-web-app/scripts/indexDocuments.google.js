#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import dotenv from 'dotenv';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';

class DocumentIndexer {
  embeddings;
  textSplitter;

  constructor(apiKey) {
    // Initialize embeddings model
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'gemini-1.5-flash-002',
      streaming: false,
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: [
        '\n\n', // Primary separator
        '\n', // Secondary separator
        ' ', // Word-level separation
      ],
    });
  }

  /**
   * Process a single PDF document
   * @param filePath Path to the PDF file
   * @returns Array of processed document chunks
   */
  async processDocument(filePath) {
    try {
      // Load PDF document
      const loader = new PDFLoader(filePath, {
        splitPages: true,
        parsedItemSeparator: '\n',
      });

      // Load raw documents
      const rawDocs = await loader.load();

      // Split documents into semantic chunks
      const splitDocs = await this.textSplitter.splitDocuments(rawDocs);

      // Enhance documents with metadata
      return splitDocs.map(
        (doc) =>
          new Document({
            pageContent: doc.pageContent,
            metadata: {
              ...doc.metadata,
              source: path.basename(filePath),
              processed_at: new Date().toISOString(),
            },
          }),
      );
    } catch (error) {
      console.error(`Error processing document ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Index multiple documents from a directory
   * @param documentDirectory Directory containing PDF documents
   * @returns HNSWLib vector store
   */
  async indexDocumentsFromDirectory(documentDirectory) {
    const documents = [];

    // Find all PDF files in the directory
    const pdfFiles = fs
      .readdirSync(documentDirectory)
      .filter((file) => path.extname(file).toLowerCase() === '.pdf')
      .map((file) => path.join(documentDirectory, file));

    // Process each PDF document
    for (const filePath of pdfFiles) {
      const processedDocs = await this.processDocument(filePath);
      documents.push(...processedDocs);
    }

    // Create vector store from processed documents
    const vectorStore = await HNSWLib.fromDocuments(documents, this.embeddings);

    console.log(`Indexed ${documents.length} document chunks from ${pdfFiles.length} documents`);

    return vectorStore;
  }

  /**
   * Validate and clean document chunks
   * @param documents Array of document chunks
   * @returns Filtered and cleaned documents
   */
  validateDocuments(documents) {
    return documents.filter((doc) => {
      // Remove extremely short or empty chunks
      const isValidLength = doc.pageContent.trim().length > 50;

      // Optional: Add more validation criteria
      const hasRelevantContent = !doc.pageContent.match(/^\s*[0-9\s]+$/);

      return isValidLength && hasRelevantContent;
    });
  }

  /**
   * Save indexed vector store to disk
   * @param vectorStore HNSWLib vector store
   * @param savePath Path to save the vector store
   */
  async saveVectorStore(vectorStore, savePath) {
    await vectorStore.save(savePath);
    console.log(`Vector store saved to ${savePath}`);
  }
}

export default DocumentIndexer;

// Load environment variables
dotenv.config();

async function main() {
  program
    .version('1.0.0')
    .description('RAG Document Indexing CLI')
    .requiredOption('-d, --directory <path>', 'Directory containing PDF documents')
    .option('-o, --output <path>', 'Output path for vector store', './vector-index')
    .action(async (options) => {
      try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error('Google AI API Key not found in .env');
        }

        // Validate input directory
        const inputDir = path.resolve(options.directory);
        if (!fs.existsSync(inputDir)) {
          throw new Error(`Directory not found: ${inputDir}`);
        }

        // Create indexer
        const indexer = new DocumentIndexer(apiKey);

        // Index documents
        console.log(`Indexing documents from: ${inputDir}`);
        const vectorStore = await indexer.indexDocumentsFromDirectory(inputDir);

        // Save vector store
        const outputPath = path.resolve(options.output);
        await indexer.saveVectorStore(vectorStore, outputPath);

        console.log(`Vector store successfully saved to: ${outputPath}`);
      } catch (error) {
        console.error('Indexing failed:', error.message);
        process.exit(1);
      }
    });

  // Parse CLI arguments
  await program.parseAsync(process.argv);
}

main();
