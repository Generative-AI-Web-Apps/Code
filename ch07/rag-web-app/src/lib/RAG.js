import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class RAG {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Google API Key is required');
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });

    this.llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-1.5-flash-002',
      streaming: false,
      logprobs: true,
    });

    this.vectorStore = null;
    this.retriever = null;
  }

  async loadIndex(path) {
    this.vectorStore = await HNSWLib.load(path, this.embeddings);
    this.retriever = this.vectorStore.asRetriever({
      k: 6,
    });
    console.log('Vector store loaded successfully');
  }

  async performRAG(query) {
    if (!this.retriever) {
      throw new Error('Retriever not initialized. Load index first.');
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
          Answer the question based only on the context provided.
  
          Context: {context}
  
          Question: {question}`);

    const formatDocs = (docs) => {
      return docs.map((doc) => doc.pageContent).join('\n\n');
    };

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

    return {
      answer: response,
      sourceDocuments,
    };
  }
}


