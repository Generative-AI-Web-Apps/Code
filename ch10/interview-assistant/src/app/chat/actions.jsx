'use server';

import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { generateId, generateText } from 'ai';
import { revalidatePath } from 'next/cache';
import { Redis } from '@upstash/redis';
import ChatBubble from '../../components/chat/ChatBubble';

import { getSupportedModel } from './utils';

import { auth } from '@clerk/nextjs/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function createInterviewSession(interviewConfig) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { jobType, difficulty, questionType, questionCount } = interviewConfig;
  const sessionId = generateId();

  // Create a more welcoming initial message
  const initialMessage = {
    id: generateId(),
    role: 'assistant',
    content: `Hello and welcome to your ${jobType} interview! I'm your interviewer today, and I'll be asking you ${questionCount} ${questionType} questions at the ${difficulty} level. I'll provide feedback after each of your responses and guide you if needed. Take your time to think through your answers - this is about understanding your approach and thought process. Ready to begin?`,
    sessionId,
  };

  // Create system prompt with interview instructions
  const systemPrompt = {
    role: 'system',
    content: `You are an interviewer for a ${jobType} position. 
    Conduct a ${difficulty} level interview with ${questionType} questions. 
    Plan to ask ${questionCount} questions in total. 
    Ask one question at a time and wait for the candidate's response before asking the next question.
    Provide constructive feedback after each answer.
    When appropriate, guide the candidate if they're heading in the wrong direction.
    At the end, summarize the interview with strengths and areas of improvement.`,
  };

  const conversationMessages = [systemPrompt, initialMessage];

  await redis.hset(`session:${sessionId}`, {
    ...interviewConfig,
    userId,
    isCompleted: false,
    createdAt: Date.now(),
    messages: conversationMessages,
  });

  await redis.sadd(`user:sessions:${userId}`, sessionId);
  revalidatePath('/chat');

  return { sessionId, initialAIState: [initialMessage] };
}

export async function getInterviewSession(sessionId) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const sessionKey = `session:${sessionId}`;
  const session = await redis.hgetall(sessionKey);

  if (!session || session.userId !== userId) {
    throw new Error('Session not found or access denied');
  }

  return session;
}

export async function revalidateRoute(path) {
  revalidatePath(path);
}

export async function fetchInterviewSessions(userId) {
  const sessionIds = await redis.smembers(`user:sessions:${userId}`);
  const sessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const session = await redis.hgetall(`session:${sessionId}`);
      return { ...session, id: sessionId };
    }),
  );
  sessions.sort((a, b) => b.createdAt - a.createdAt);
  return sessions;
}

export async function continueConversation(input) {
  'use server';
  const supportedModel = getSupportedModel('google', 'models/gemini-1.5-pro-latest');
  const history = getMutableAIState();
  const result = await streamUI({
    model: supportedModel,
    messages: [...history.get(), { role: 'user', content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done([...history.get(), { role: 'assistant', content: input }]);
      }
      return <ChatBubble role="assistant" text={content} className={`mr-auto border-none`} />;
    },
  });

  return {
    id: generateId(),
    role: 'assistant',
    display: result.value,
  };
}

export async function completeInterviewSession(sessionId) {
  'use server';

  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const sessionKey = `session:${sessionId}`;
  const session = await redis.hgetall(sessionKey);

  if (!session || session.userId !== userId) {
    throw new Error('Session not found or access denied');
  }

  if (session.isCompleted) {
    return session; // Already completed
  }

  // Mark session as completed
  await redis.hset(sessionKey, {
    ...session,
    isCompleted: true,
    completedAt: Date.now(),
  });

  revalidatePath(`/chat/${sessionId}`);

  return {
    ...session,
    isCompleted: true,
    completedAt: Date.now(),
  };
}

export async function continueConversationAndSave(input, sessionId) {
  'use server';
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const sessionKey = `session:${sessionId}`;
  const session = await redis.hgetall(sessionKey);

  if (!session || session.userId !== userId) {
    throw new Error('Session not found or access denied');
  }

  if (session.isCompleted) {
    throw new Error('Cannot update a completed interview session');
  }

  const supportedModel = getSupportedModel('google', 'models/gemini-1.5-pro-latest');
  
  const messages = Array.isArray(session.messages) ? session.messages : [];
  
  const userMessage = {
    id: generateId(),
    role: 'user',
    content: input,
    sessionId,
  };

  const updatedMessages = [...messages, userMessage];

  await redis.hset(sessionKey, {
    ...session,
    messages: updatedMessages,
    updatedAt: Date.now(),
  });

  const history = getMutableAIState();
  history.set(updatedMessages);

  const result = await streamUI({
    model: supportedModel,
    messages: [...updatedMessages],
    text: ({ content, done }) => {
      if (done) {
        const aiMessage = {
          id: generateId(),
          role: 'assistant',
          content,
          sessionId,
        };

        const finalMessages = [...updatedMessages, aiMessage];

        redis
          .hset(sessionKey, {
            ...session,
            messages: finalMessages,
            updatedAt: Date.now(),
          })
          .catch((error) => {
            console.error('Error saving AI message:', error);
          });

        history.done([...finalMessages]);
      }
      return <ChatBubble role="assistant" text={content} className={`mr-auto border-none`} />;
    },
  });

  return {
    id: generateId(),
    role: 'assistant',
    display: result.value,
    content: result.value.props.text,
  };
}

export async function generateInterviewFeedback(sessionId) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const sessionKey = `session:${sessionId}`;
  const session = await redis.hgetall(sessionKey);

  if (!session) {
    throw new Error('Session not found');
  }

  const messages = session.messages || [];
  const prompt = `
  Please provide comprehensive feedback for this interview.
      The session contains the following messages:
      ${messages.map((message) => `${message.role}: ${message.content}`).join('\n')}

      Provide a structured feedback summary covering these points:
      - Overall performance: Assess the candidate's overall performance.
      - Strengths: Highlight the candidate's strengths demonstrated during the interview.
      - Areas for improvement: Suggest areas where the candidate could improve.
      - Technical skills: Evaluate the candidate's technical skills based on their responses.
      - Communication skills: Assess the candidate's communication skills.
      - Recommendations: Provide specific recommendations for the candidate.
  `;

  const supportedModel = getSupportedModel('google', 'models/gemini-1.5-pro-latest');

  try {
    const { text } = await generateText({
      model: supportedModel,
      prompt,
    });
    return text;
  } catch (error) {
    console.error('Error generating interview feedback:', error);
    return 'Error generating feedback. Please try again.';
  }
}

export async function getInterviewFeedback(sessionId) {
  const feedbackKey = `feedback:${sessionId}`;
  const feedback = await redis.get(feedbackKey);
  return feedback ? String(feedback) : null;
}

export async function saveInterviewFeedback(sessionId, feedback) {
  const feedbackKey = `feedback:${sessionId}`;
  await redis.set(feedbackKey, feedback);
}

export const AI = createAI({
  actions: {
    continueConversation,
    continueConversationAndSave,
    createInterviewSession,
    completeInterviewSession
  },
  initialAIState: [],
  initialUIState: [],
});
