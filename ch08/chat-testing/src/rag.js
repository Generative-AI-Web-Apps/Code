import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import fs from 'fs';
import path from 'path';

import 'dotenv/config';
const apiKey = process.env.GOOGLE_API_KEY;

export class RAGSystem {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Google API Key is required');
    }

    // Configure embeddings and language model
    this.embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });

    this.llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-1.5-flash-002',
      streaming: false,
    });

    this.vectorStore = null;
    this.retriever = null;
  }

  async indexDocuments(documentDirectory) {
    const documents = [];
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Read and process all PDF files in the directory
    const files = fs.readdirSync(documentDirectory).filter((file) => path.extname(file).toLowerCase() === '.pdf');

    for (const file of files) {
      const filePath = path.join(documentDirectory, file);
      const loader = new PDFLoader(filePath, { verbose: true });

      const docs = await loader.load();
      const splitDocs = await textSplitter.splitDocuments(docs);
      documents.push(...splitDocs);
    }
    console.debug(documents);
    // Create vector store
    this.vectorStore = await HNSWLib.fromDocuments(documents, this.embeddings);
    // Configure retriever
    this.retriever = this.vectorStore.asRetriever({
      k: 6, // number of documents to retrieve
    });
    console.log(`Indexed ${documents.length} document chunks`);
  }

  async performRAG(query) {
    if (!this.retriever) {
      throw new Error('Retriever not initialized. Run indexDocuments first.');
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the question based only on the context provided.

        Context: {context}

        Question: {question}`);

    const chain = RunnableSequence.from([
      {
        context: this.retriever.pipe(formatDocs),
        question: new RunnablePassthrough(),
      },
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke(query);
    const sourceDocuments = await this.retriever.invoke(query);
    console.log('Source documents:', sourceDocuments);

    return {
      answer: response,
      sourceDocuments,
    };
  }

  async saveIndex(path) {
    if (this.vectorStore) {
      await this.vectorStore.save(path);
      console.log('Vector store saved successfully');
    }
  }

  async loadIndex(path) {
    this.vectorStore = await HNSWLib.load(path, this.embeddings);
    this.retriever = this.vectorStore.asRetriever({
      k: 6,
    });
    console.log('Vector store loaded successfully');
  }
}

const formatDocs = (docs) => {
  return docs.map((doc) => doc.pageContent).join('\n\n');
};
