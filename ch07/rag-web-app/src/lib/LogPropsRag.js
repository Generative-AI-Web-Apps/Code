import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class LogProbsRag {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('OpenAI API Key is required');
    }
    this.embeddings = new OpenAIEmbeddings({ 
      apiKey,
      model: options.embeddingModel || 'text-embedding-3-small',
    });

    this.llm = new ChatOpenAI({
      apiKey,
      model: options.model || 'gpt-3.5-turbo',
      temperature: options.temperature || 0.7,
      streaming: false,
      logprobs: true,
      topLogprobs: 3
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

  /**
   * Evaluate the confidence of having sufficient context to answer a question
   * @param {string} context - The retrieved context to evaluate
   * @param {string} question - The question to check
   * @returns {Promise<Object>} Confidence scoring results
   */
  async evaluateContextConfidence(context, question) {
    try {
      const response = await this.llm.invoke([
        {
          role: 'user',
          content: `You retrieved this article: ${context}. The question is: ${question}.
Before even answering the question, consider whether you have sufficient information in the article to answer the question fully.
Your output should JUST be the boolean true or false, of if you have sufficient information in the article to answer the question.
Respond with just one word, the word 'True', or the word 'False', nothing else.`,
        },
      ]);

      // Extract log probabilities for the response
      const logprobs = response.response_metadata.logprobs.content;
      console.log('Logprobs:', logprobs);

      // Check if any logprob indicates a confident response
      const hasSufficientContext = logprobs.some(lp => lp.token.trim().toLowerCase() === 'true' || lp.token.trim().toLowerCase() === 'false');
      console.log('Has sufficient context:', hasSufficientContext);
      const confidenceResults = logprobs.map(lp => ({
        token: lp.token,
        logprob: lp.logprob,
        linearProbability: Math.round(Math.exp(lp.logprob) * 10000) / 100 // Convert logprob to linear probability
      }));
      console.log('Confidence results:', confidenceResults);

      return {
        hasSufficientContext,
        confidenceResults
      };
    } catch (error) {
      console.error('Error evaluating context confidence:', error);
      return null;
    }
  }

  async performRAG(query, useWebFallback = false) {
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

  /**
   * Enhanced RAG query with confidence scoring
   * @param {string} query - The user's query
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} RAG response with confidence metrics
   */
  async performEnhancedRAG(query, options = {}) {
    const {
      confidenceThreshold = 90,
      fallbackStrategy = 'default', 
    } = options;

    try {
      // Perform initial RAG retrieval
      const ragResponse = await this.performRAG(query);

      // Evaluate context confidence
      const confidenceResult = await this.evaluateContextConfidence(
        ragResponse.sourceDocuments.map((doc) => doc.pageContent).join('\n\n'),
        query,
      );
      console.log('Confidence result:', JSON.stringify(confidenceResult));
      // Check confidence level
      if (
        confidenceResult &&
        confidenceResult.confidenceResults.length &&
        confidenceResult.confidenceResults[0].token == 'True' &&
        confidenceResult.confidenceResults[0].linearProbability >= confidenceThreshold
      ) {
        // High confidence response
        return {
          ...ragResponse,
          confidenceMetrics: confidenceResult,
        };
      }

      // Handle low confidence based on fallback strategy
      switch (fallbackStrategy) {
        case 'web':
          return this.performRAG(query, true);

        case 'retry':
          console.warn('Low confidence. Retrying with alternative retrieval.');
          return this.performRAG(query);

        case 'ask_user':
          return {
            answer: 'I do not have sufficient context to confidently answer this question. Would you like to rephrase or provide more context?',
            confidenceMetrics: confidenceResult,
            suggestion: 'Would you like to rephrase or provide more context?',
            sourceDocuments: [] // Ensure sourceDocuments is defined as an empty array
          };

        default:
          return {
            ...ragResponse,
            confidenceMetrics: confidenceResult,
            warning: 'Low confidence in retrieved context',
            sourceDocuments: [] // Ensure sourceDocuments is defined as an empty array
          };
      }
    } catch (error) {
      console.error('Enhanced RAG query failed:', error);
      throw error;
    }
  }
}