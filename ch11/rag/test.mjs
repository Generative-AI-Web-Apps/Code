// // import { deleteDocument } from '@/lib/database';
// import { Index } from '@upstash/vector';
// import 'dotenv/config';

// let id='doc:1745505968415-px41c0t-';
// let knowledgebaseId='kb:1744980761817-6wmp82c';
// const upstashIndex = new Index({
//   url: process.env.UPSTASH_VECTOR_REST_URL,
//   token: process.env.UPSTASH_VECTOR_REST_TOKEN,
// });
// const ids = await upstashIndex.fetch({prefix: id}, {namespace: knowledgebaseId});
// console.debug('Fetched IDs:', ids);


// // Configuration
// const knowledgeBaseId = 'kb_1746093987336_jz1z6ol';
// const testQuery = 'Who is the author of "To Kill a Mockingbird"?';

// async function testRetrieval() {
//   console.log('Starting vector store retrieval test...');

//   try {
//     // Initialize Upstash Vector Index
//     const upstashIndex = new Index({
//       url: process.env.UPSTASH_VECTOR_REST_URL,
//       token: process.env.UPSTASH_VECTOR_REST_TOKEN,
//     });

//     // Test direct ID fetching
//     const documentId = 'doc:1745849491969-v0jnxfz';
//     console.log(`\nFetching document with ID: ${documentId}`);
//     const documentIds = await upstashIndex.fetch({ prefix: documentId }, { namespace: knowledgeBaseId });
//     console.log('Fetched IDs:', documentIds);

//     // Initialize OpenAI embeddings
//     console.log('\nInitializing OpenAI embeddings...');
//     const embeddings = new OpenAIEmbeddings({
//       model: "text-embedding-3-small",
//     });

//     // Initialize vector store
//     console.log('Connecting to vector store...');
//     const vectorStore = new UpstashVectorStore(embeddings, {
//       index: upstashIndex,
//       namespace: knowledgeBaseId,
//     });

//     // List all documents in the knowledge base
//     console.log('\nListing all documents in knowledge base...');
//     const allDocuments = await upstashIndex.fetch({prefix: knowledgeBaseId}, {namespace: knowledgeBaseId});
//     console.log(`Found ${allDocuments.length} documents:`);
//     allDocuments.slice(0, 5).forEach(doc => console.log(`- ${doc.id}`));
//     if (allDocuments.length > 5) console.log(`... and ${allDocuments.length - 5} more`);

//     // Test similarity search
//     console.log('\nPerforming similarity search...');
//     const results = await vectorStore.similaritySearch(testQuery, 3);

//     console.log(`\nTop 3 results for query: "${testQuery}"`);
//     results.forEach((doc, i) => {
//       console.log(`\nResult ${i + 1}:`);
//       console.log(`ID: ${doc.metadata.id || 'N/A'}`);
//       console.log(`Source: ${doc.metadata.source || 'N/A'}`);
//       console.log(`Content: ${doc.pageContent.substring(0, 100)}${doc.pageContent.length > 100 ? '...' : ''}`);
//     });

//     // Test retriever
//     console.log('\nTesting retriever functionality...');
//     const retriever = vectorStore.asRetriever({
//       k: 5,
//     });

//     const retrievedDocs = await retriever.invoke(testQuery);
//     console.log(`\nRetrieved ${retrievedDocs.length} documents using retriever:`);
//     retrievedDocs.forEach((doc, i) => {
//       console.log(`\nRetrieved Doc ${i + 1}:`);
//       console.log(`ID: ${doc.metadata.id || 'N/A'}`);
//       console.log(`Source: ${doc.metadata.source || 'N/A'}`);
//       console.log(`Content: ${doc.pageContent.substring(0, 100)}${doc.pageContent.length > 100 ? '...' : ''}`);
//     });

//     console.log('\nRetrieval test completed successfully!');
//   } catch (error) {
//     console.error('Error during retrieval test:', error);
//   }
// }

// // Run the test
// testRetrieval();
import 'dotenv/config';
import { Document } from '@langchain/core/documents';

import { Index } from '@upstash/vector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { UpstashVectorStore } from '@langchain/community/vectorstores/upstash';
import 'dotenv/config';

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'models/embedding-001',
});

const upstashIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

const vectorStore = new UpstashVectorStore(embeddings, {
  index: upstashIndex,
});

// Fake documents
const docs = [
  new Document({ pageContent: 'I love working from coworking spaces with good coffee.', metadata: { id: 1 } }),
  new Document({ pageContent: 'Libraries are great for quiet, focused work.', metadata: { id: 2 } }),
  new Document({
    pageContent: 'Remote working gives me freedom to travel and work from anywhere.',
    metadata: { id: 3 },
  }),
];

async function main() {
  for (const doc of docs) {
    const vector = await embeddings.embedQuery(doc.pageContent);
    console.log(`Embedding vector length for doc id=${doc.metadata.id}:`, vector.length);
  }
  // Create a memory vector store with real Google embeddings
  await vectorStore.addDocuments(docs);

  // Test similarity search
  const results = await vectorStore.similaritySearch('Where can I work remotely?', 2);

  console.log('🔍 Similarity Search Results:');
  results.forEach((res, i) => {
    console.log(`\nResult ${i + 1}`);
    console.log('Content:', res.pageContent);
    console.log('Metadata:', res.metadata);
  });
}

main();
