'use server';

import { generateId } from 'ai';
import ChatBubble from '../../components/chat/ChatBubble';
import { getMutableAIState, createAI } from 'ai/rsc';
// import { RAG } from '@/lib/RAG';
import { LogProbsRag as RAG } from '@/lib/LogPropsRag';
import { getAbsoluteRAGIndexPath } from '@/lib/utils';
const apiKey = process.env.OPENAI_API_KEY;

let ragSystem;
export async function initializeRAG() {
  if (!ragSystem) {
    ragSystem = new RAG(apiKey);
    const indexPath = getAbsoluteRAGIndexPath();
    await ragSystem.loadIndex(indexPath);
  }
  return ragSystem;
}

// Main function to handle conversation continuation
export async function continueConversation(input) {
  const aiState = getMutableAIState();

  try {
    // Ensure RAG system is initialized
    const rag = await initializeRAG();

    // // Perform enhanced RAG query
    // const result = await rag.performRAG(
    //   input,
    // );

    // Perform enhanced RAG query
    const result = await rag.performEnhancedRAG(
      input,
      {
        confidenceThreshold: 85,
        fallbackStrategy: 'ask_user'
      }
    );
    
    // Log confidence metrics if available
    if (result.confidenceMetrics) {
      console.log('Confidence Metrics:', result.confidenceMetrics);
      console.log('Results:', result);
    }

    const message = {
      id: generateId(),
      role: 'assistant',
      content: result.answer,
    };

    aiState.done({
      ...aiState.get(),
      messages: [...aiState.get().messages, message],
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

// Create AI instance with actions
export const AI = createAI({
  actions: {
    continueConversation,
  },
  initialAIState: { messages: [] },
  initialUIState: [],
});
