import fs from 'fs/promises';
import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export async function processDocument(filePath, fileType, documentId) {
  let text = '';
  let chunks = [];

  try {
    switch (fileType) {
      case 'application/pdf':
        chunks = await processPdf(filePath, documentId);
        return chunks;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        text = await processDocx(filePath);
        break;
      case 'text/plain':
      case 'text/markdown':
        text = await processTextFile(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // For non-PDF documents, we still need to split text into chunks
    if (fileType !== 'application/pdf') {
      chunks = await splitTextIntoChunks(text, fileType, path.basename(filePath), documentId);
    }

    return chunks;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

async function processPdf(filePath, documentId) {
  try {
    // Use LangChain's PDFLoader to load the PDF
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    // LangChain's PDFLoader already splits the PDF into pages
    // We'll create our chunks based on these pages
    return docs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        ...doc.metadata,
        documentId,
        fileName: path.basename(filePath),
        fileType: 'application/pdf',
        chunkIndex: index,
      },
    }));
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

// Process DOCX files
async function processDocx(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.toString();
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw error;
  }
}

// Process plain text files
async function processTextFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error parsing text file:', error);
    throw error;
  }
}

// Split text into chunks for efficient retrieval
async function splitTextIntoChunks(text, fileType, fileName, documentId) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Split the text into chunks
  const rawChunks = await splitter.splitText(text);

  // Create metadata for each chunk
  return rawChunks.map((content, index) => ({
    content,
    metadata: {
      documentId,
      fileName,
      fileType,
      chunkIndex: index,
    },
  }));
}
