import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { DynamicRetrievalMode } from '@google/generative-ai';

export class RAG {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Google API Key is required');
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });

    // Default options with overrides
    this.options = {
      vectorStoreK: 6,
      webSearchThreshold: 0.7,
      useWebGrounding: true,
      ...options,
    };

    this.llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-1.5-flash-002',
      streaming: false,
    });

    this.vectorStore = null;
    this.retriever = null;
    this.searchRetrievalTool = null;
    this.enableWebGrounding();
  }

  async loadIndex(path) {
    this.vectorStore = await HNSWLib.load(path, this.embeddings);
    this.retriever = this.vectorStore.asRetriever({
      k: this.options.vectorStoreK,
    });
    console.log('Vector store loaded successfully');
  }

  enableWebGrounding() {
    // Initialize the Google Search Retrieval Tool
    this.searchRetrievalTool = {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalMode.MODE_DYNAMIC,
          dynamicThreshold: this.options.webSearchThreshold,
        },
      },
    };

    // Modify the LLM to include web search retrieval
    this.groundedLLM = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-pro',
      temperature: 0,
      maxRetries: 0,
    }).bindTools([this.searchRetrievalTool]);

    this.options.useWebGrounding = true;
    return this;
  }

  async performRAG(query, useWebGrounding = null) {
    // Determine if web grounding should be used
    const shouldUseWebGrounding = useWebGrounding ?? this.options.useWebGrounding;

    if (!this.retriever) {
      throw new Error('Retriever not initialized. Load index first.');
    }

    const formatDocs = (docs) => {
      return docs.map((doc) => doc.pageContent).join('\n\n');
    };

    // Retrieve vector store documents
    const sourceDocuments = await this.retriever.invoke(query);
    const vectorStoreContext = formatDocs(sourceDocuments);
    // If web grounding is enabled and configured
    if (shouldUseWebGrounding && this.searchRetrievalTool) {
      try {
        // Perform web search grounded query
        const webGroundedResponse = await this.groundedLLM.invoke(query);
        const groundingMetadata = webGroundedResponse.candidates[0].groundingMetadata;
        console.log("GroundingMetadata is: ", JSON.stringify(groundingMetadata));

        const prompt = ChatPromptTemplate.fromTemplate(`
Synthesize an answer based on the following contexts. 
Prioritize information from the Vector Store Context, 
and use Web Search Context to supplement or provide additional insights.

Vector Store Context: {vector_store_context}

Web Search Context: {web_search_context}

Question: {question}`);

        const chain = RunnableSequence.from([
          {
            vector_store_context: () => vectorStoreContext,
            web_search_context: () => webGroundedResponse.content,
            question: new RunnablePassthrough(),
          },
          prompt,
          this.llm,
          new StringOutputParser(),
        ]);

        const response = await chain.invoke(query);

        return {
          answer: response,
          sourceDocuments,
          webSearchResults: {
            content: webGroundedResponse.content,
            metadata: webGroundedResponse.response_metadata?.groundingMetadata,
          },
        };
      } catch (error) {
        console.warn('Web grounding failed, falling back to vector store retrieval', error);
        return this.performRAG(query, false);
      }
    }

    // Standard vector store retrieval
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

    return {
      answer: response,
      sourceDocuments,
    };
  }
}
