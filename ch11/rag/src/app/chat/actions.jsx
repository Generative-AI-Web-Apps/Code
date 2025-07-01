'use server';

import { generateId } from 'ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { UpstashVectorStore } from '@langchain/community/vectorstores/upstash';
import { Index } from '@upstash/vector';
import { getMutableAIState, createAI } from 'ai/rsc';
import ChatBubble from '@/components/chat/ChatBubble';

class RAG {
  constructor(knowledgeBaseId) {
    this.knowledgeBaseId = knowledgeBaseId;
    this.llm = null;
    this.retriever = null;
    this.historyAwareRetriever = null;
  }

  async initialize() {
    if (this.retriever) return;

    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-1.5-flash',
      streaming: false,
    });

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
      namespace: this.knowledgeBaseId,
    });

    this.retriever = vectorStore.asRetriever({
      k: 5,
    });

    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        "Reformulate the user's question into a standalone question that doesn't require chat history to understand. Don't answer it, just reformulate if needed.",
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ]);

    this.historyAwareRetriever = await createHistoryAwareRetriever({
      llm: this.llm,
      retriever: this.retriever,
      rephrasePrompt: contextualizeQPrompt,
    });
  }

  async performRAG(query, chatHistory = []) {
    await this.initialize();

    const qaPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Answer the question concisely using the provided contexts.
  
  Context:
  {context}
  
  Cite sources using [citation:x] where x is the context number. Be accurate, professional, and unbiased. Indicate when information is missing. Respond in the same language as the question except for code and specific terms.`,
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ]);

    const relevantDocs = await this.historyAwareRetriever.invoke({
      input: query,
      chat_history: chatHistory,
    });

    console.log('prompt', qaPrompt);
    console.log('relevantDocs', relevantDocs);

    const documentChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt: qaPrompt,
      documentPrompt: PromptTemplate.fromTemplate('- {page_content}\n'),
    });

    const result = await documentChain.invoke({
      input: query,
      chat_history: chatHistory,
      context: relevantDocs, // This needs to match the variable name in the prompt
    });

    return {
      answer: result,
      sourceDocuments: relevantDocs,
    };
  }
}

const ragInstances = new Map();

async function getRagInstance(knowledgeBaseId) {
  if (!ragInstances.has(knowledgeBaseId)) {
    const rag = new RAG(knowledgeBaseId);
    ragInstances.set(knowledgeBaseId, rag);
    await rag.initialize();
  }
  return ragInstances.get(knowledgeBaseId);
}

export async function continueConversation(input, knowledgeBaseId) {
  const aiState = getMutableAIState();
  try {
    const rag = await getRagInstance(knowledgeBaseId);
    const messages = aiState.get().messages || [];
    const chatHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const result = await rag.performRAG(input, chatHistory);
    const message = {
      id: generateId(),
      role: 'assistant',
      content: result.answer,
    };

    aiState.done({
      ...aiState.get(),
      messages: [...messages, message],
    });

    return {
      id: generateId(),
      display: (
        <ChatBubble
          role="assistant"
          text={result.answer}
          className="mr-auto border-none"
          sources={result.sourceDocuments.map((doc) => doc.metadata)}
        />
      ),
      role: 'assistant',
    };
  } catch (error) {
    console.error('Error in continueConversation:', error);
    const errorMessage = `An error occurred: ${error.message}`;

    return {
      id: generateId(),
      display: <ChatBubble role="assistant" text={errorMessage} className="mr-auto border-none text-red-500" />,
      role: 'assistant',
    };
  }
}

export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: { messages: [] },
  initialUIState: [],
});
