import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { addDocument } from '@/lib/database';
import { processDocument } from '@/lib/documentProcessing';
import { UpstashVectorStore } from '@langchain/community/vectorstores/upstash';
import { OpenAIEmbeddings } from "@langchain/openai";
import { Index } from '@upstash/vector';
import { Document } from '@langchain/core/documents';
import { existsSync } from 'fs';

export async function POST(request, { params }) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    const knowledgeBaseId = decodeURIComponent(formData.get('knowledgeBaseId'));
    if (!knowledgeBaseId) {
      return NextResponse.json({ error: 'Knowledge base ID is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
    });

    const upstashIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });

    const vectorStore = new UpstashVectorStore(embeddings, {
      index: upstashIndex,
      namespace: knowledgeBaseId,
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedDocs = [];
    for (const fileData of files) {
      try {
        if (!fileData) {
          continue;
        }

        // In Node.js, we check the properties of the formData file object
        const fileName = fileData.name;
        const fileType = fileData.type;
        const fileSize = fileData.size;

        // Get file buffer from FormData entry
        const bytes = await fileData.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save file to disk
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        // Add document to database
        const doc = await addDocument({
          filename: fileName,
          originalName: fileName,
          fileType: fileType,
          fileSize: fileSize,
          knowledgeBaseId,
        });
        const chunks = await processDocument(`${uploadsDir}/${fileName}`, fileType, doc.id);
        const chunkCount = chunks.length;
        const langChainDocs = chunks.map(
          (chunk, index) =>
            new Document({
              pageContent: chunk.content,
              metadata: {
                ...chunk.metadata,
                documentId: doc.id,
                knowledgeBaseId,
                chunkCount: chunkCount,
                chunkIndex: index,
              },
            }),
        );
       
        const chunkIds = chunks.map((_, index) => `${doc.id}-chunk-${index}`);
        await vectorStore.addDocuments(langChainDocs, { ids: chunkIds });
        uploadedDocs.push(doc);
      } catch (error) {
        console.error(`Error processing file ${fileData?.name || 'unknown'}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      count: uploadedDocs.length,
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 });
  }
}
