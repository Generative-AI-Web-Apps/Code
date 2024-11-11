import { Document } from "@langchain/core/documents";
import { extractImages, getDocumentProxy } from 'unpdf'
import { BufferLoader } from "langchain/document_loaders/fs/buffer";
import * as fs from "fs";

/**
 * A class that extends the `BufferLoader` class. It represents a document
 * loader that loads documents from PDF files and extracts images.
 */
export class PDFLoader extends BufferLoader {
  splitPages;
  pdfjs;
  parsedItemSeparator;

  constructor(
    filePathOrBlob,
    {
      splitPages = true,
      parsedItemSeparator = "",
    } = {}
  ) {
    super(filePathOrBlob);
    this.splitPages = splitPages;
    this.parsedItemSeparator = parsedItemSeparator;
  }

  /**
   * A method that takes a `raw` buffer and `metadata` as parameters and
   * returns a promise that resolves to an array of `Document` instances.
   * It extracts both text and images from the PDF.
   * @param raw The buffer to be parsed.
   * @param metadata The metadata of the document.
   * @returns A promise that resolves to an array of `Document` instances.
   */
  async parse(raw, metadata) {
    const pdf = await getDocumentProxy(new Uint8Array(raw.buffer))

    const meta = await pdf.getMetadata().catch(() => null);
    const documents = [];
    const images = []; // Array to store image binary data

    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      if (content.items.length === 0) {
        continue;
      }

      // Extract text content
      let lastY;
      const textItems = [];
      for (const item of content.items) {
        if ("str" in item) {
          if (lastY === item.transform[5] || !lastY) {
            textItems.push(item.str);
          } else {
            textItems.push(`\n${item.str}`);
          }
          lastY = item.transform[5];
        }
      }

      const text = textItems.join(this.parsedItemSeparator);

      // Extract images from the page
      const pageImages = await extractImages(pdf, i);
      if (pageImages.length > 0) {
        saveByteArrayAsPNG('output.png', pageImages[0]);
      }
      images.push(...pageImages); // Store extracted image data

      documents.push(
        new Document({
          pageContent: text,
          metadata: {
            ...metadata,
            pdf: {
              version: pdf.version,
              info: meta?.info,
              metadata: meta?.metadata,
              totalPages: pdf.numPages,
            },
            loc: {
              pageNumber: i,
            },
          },
        })
      );
    }

    // Optionally, you can attach images to each document or handle them separately
    for (const doc of documents) {
      doc.metadata.images = images; // Attach all images to each document's metadata
    }

    return this.splitPages ? documents : [this.combineDocuments(documents)];
  }

  /**
   * Combines multiple Document instances into a single Document.
   * @param documents The array of Document instances to combine.
   * @returns A single Document instance containing concatenated content.
   */
  combineDocuments(documents) {
    return new Document({
      pageContent: documents.map((doc) => doc.pageContent).join("\n\n"),
      metadata: documents[0].metadata, // You might want to handle metadata merging more carefully
    });
  }
}

function saveByteArrayAsPNG(filename, byteArray) {
  // Create a Buffer from the Uint8Array
  const buffer = Buffer.from(byteArray);

  // Write the buffer to a PNG file
  fs.writeFile(filename, buffer, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('File saved successfully as', filename);
    }
  });
}

const pdfPath =
  "/Users/theo.despoudis/workspace/Generative-AI-Web-Apps/ch07/summarization-web-app/docs/tiny-data.pdf";
const loader = new PDFLoader(pdfPath, { parsedItemSeparator: "" });
const docs = await loader.load();

function normalizeDocuments(docs) {
  return docs.map((doc) => {
    let pageContent;

    // Normalize the content based on its type
    if (typeof doc.pageContent === "string") {
      pageContent = doc.pageContent;
    } else if (Array.isArray(doc.pageContent)) {
      pageContent = doc.pageContent.join("\n");
    }
    // Perform cleanup operations on the page content
    if (pageContent) {

      // Trim whitespace
      pageContent = pageContent.trim();

      // Remove unwanted characters (e.g., figure references)
      pageContent = pageContent.replace(/Figure \d+:.*?\n/g, '').replace(/−\d+\n/g, '');

      // Normalize spaces
      pageContent = pageContent.replace(/\s+/g, ' ');
      pageContent = pageContent.replace(/(\s*l\s*){2,}/g, ' ');

      // Filter out non-content lines (example)
      const filteredDocument = pageContent.split('\n').filter(line => 
        !line.includes('References') && !line.includes('Acknowledgments')
      );
      doc.pageContent = filteredDocument;
      return doc;
    }

    return null; 
  }).filter(doc => doc.content !== null); // Filter out any null entries from the result
}
console.log(normalizeDocuments(docs));