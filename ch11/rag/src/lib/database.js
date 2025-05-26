import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});


function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createKnowledgeBase(knowledgeBase) {
  const id = generateId('kb');
  const kb = {
    id,
    name: knowledgeBase.name,
    description: knowledgeBase.description || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await redis.hset(`knowledgebase_${id}`, kb);
  await redis.sadd('knowledgebases', id);

  return kb;
}

export async function getKnowledgeBase(id) {
  return await redis.hgetall(`knowledgebase_${id}`);
}

export async function getAllKnowledgeBases() {
  const ids = await redis.smembers('knowledgebases');
  if (!ids || ids.length === 0) return [];

  const knowledgeBases = await Promise.all(
    ids.map(async (id) => {
      const kb = await redis.hgetall(`knowledgebase_${id}`);
      if (!kb) return null;

      const documentCount = await redis.scard(`${id}_documents`);
      return {
        ...kb,
        _count: {
          documents: documentCount || 0,
        },
      };
    }),
  );

  return knowledgeBases.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateKnowledgeBase(id, data) {
  const kb = await redis.hgetall(`knowledgebase_${id}`);
  if (!kb) throw new Error('Knowledge base not found');

  const updatedKb = {
    ...kb,
    ...data,
    updatedAt: Date.now(),
  };

  await redis.hset(`knowledgebase_${id}`, updatedKb);
  return updatedKb;
}

export async function deleteKnowledgeBase(id) {
  const documentIds = await redis.smembers(`${id}_documents`);

  for (const docId of documentIds) {
    await deleteDocument(docId);
  }

  const sessionIds = await redis.smembers(`${id}_chatsessions`);
  for (const sessionId of sessionIds) {
    await deleteChatSession(sessionId);
  }

  // Delete the knowledge base itself
  await redis.del(`knowledgebase_${id}`);
  await redis.del(`${id}_documents`);
  await redis.del(`${id}_chatsessions`);
  await redis.srem('knowledgebases', id);
}

// Document operations
export async function addDocument(document) {
  const id = generateId('doc');
  const doc = {
    id,
    filename: document.filename,
    originalName: document.originalName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    knowledgeBaseId: document.knowledgeBaseId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await redis.hset(`document_${id}`, doc);
  await redis.sadd(`${document.knowledgeBaseId}_documents`, id);

  return doc;
}

export async function updateDocumentChunkCount(documentId, count) {
  const doc = await redis.hgetall(`document_${documentId}`);
  if (!doc) throw new Error('Document not found');

  await redis.hset(`document_${documentId}`, {
    ...doc,
    chunkCount: count,
    updatedAt: Date.now(),
  });
}

export async function getDocument(id) {
  return await redis.hgetall(`document_${id}`);
}

export async function getDocumentsByKnowledgeBase(knowledgeBaseId) {
  console.log('knowledgeBaseId:', `${knowledgeBaseId}_documents`);
  const documentIds = await redis.smembers(`${knowledgeBaseId}_documents`);
  console.log('documentIds:', documentIds);
  if (!documentIds || documentIds.length === 0) return [];

  const documents = await Promise.all(
    documentIds.map(async (id) => {
      const doc = await redis.hgetall(`document_${id}`);
      if (!doc) return null;

      return {
        ...doc,
      };
    }),
  );

  return documents.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDocument(id) {
  const doc = await redis.hgetall(`document_${id}`);
  if (!doc) return;

  await redis.del(`document_${id}`);

  if (doc.knowledgeBaseId) {
    await redis.srem(`${doc.knowledgeBaseId}_documents`, id);
  }
}

// Chat Session operations
export async function createChatSession(session) {
  const id = generateId('chat');
  const chatSession = {
    id,
    name: session.name || `Chat ${new Date().toLocaleDateString()}`,
    knowledgeBaseId: session.knowledgeBaseId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await redis.hset(`chatsession_${id}`, chatSession);
  await redis.sadd(`${session.knowledgeBaseId}_chatsessions`, id);
  await redis.sadd('chatsessions', id);

  return chatSession;
}

export async function getChatSession(id) {
  return await redis.hgetall(`chatsession_${id}`);
}

export async function getAllChatSessions() {
  const ids = await redis.smembers('chatsessions');
  if (!ids || ids.length === 0) return [];

  const sessions = await Promise.all(
    ids.map(async (id) => {
      const session = await redis.hgetall(`chatsession_${id}`);
      if (!session) return null;

      // Get message count
      const messageCount = await redis.llen(`chatsession_${id}_messages`);

      return {
        ...session,
        _count: {
          messages: messageCount || 0,
        },
      };
    }),
  );

  return sessions.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getChatSessionsByKnowledgeBase(knowledgeBaseId) {
  const sessionIds = await redis.smembers(`${knowledgeBaseId}_chatsessions`);
  if (!sessionIds || sessionIds.length === 0) return [];

  const sessions = await Promise.all(
    sessionIds.map(async (id) => {
      const session = await redis.hgetall(`chatsession_${id}`);
      if (!session) return null;

      // Get message count
      const messageCount = await redis.llen(`chatsession_${id}_messages`);

      return {
        ...session,
        _count: {
          messages: messageCount || 0,
        },
      };
    }),
  );

  return sessions.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteChatSession(id) {
  const session = await redis.hgetall(`chatsession_${id}`);
  if (!session) return;

  // Delete all messages
  await redis.del(`chatsession_${id}_messages`);
  await redis.del(`chatsession_${id}`);

  if (session.knowledgeBaseId) {
    await redis.srem(`${session.knowledgeBaseId}_chatsessions`, id);
  }

  await redis.srem('chatsessions', id);
}

// Chat Message operations
export async function addChatMessage(message) {
  const id = generateId('msg');
  const chatMessage = {
    id,
    content: message.content,
    role: message.role,
    chatSessionId: message.chatSessionId,
    sources: message.sources ? JSON.stringify(message.sources) : null,
    createdAt: Date.now(),
  };

  await redis.hset(`message_${id}`, chatMessage);

  await redis.rpush(`chatsession_${message.chatSessionId}_messages`, id);

  await redis.hset(`chatsession_${message.chatSessionId}`, {
    updatedAt: Date.now(),
  });

  return chatMessage;
}

export async function getChatMessages(chatSessionId) {
  const messageIds = await redis.lrange(`chatsession_${chatSessionId}_messages`, 0, -1);
  if (!messageIds || messageIds.length === 0) return [];

  const messages = await Promise.all(
    messageIds.map(async (id) => {
      const message = await redis.hgetall(`message_${id}`);
      if (!message) return null;

      // Parse sources back to array if present
      if (message.sources) {
        try {
          message.sources = JSON.parse(message.sources);
        } catch (e) {
          message.sources = [];
        }
      }

      return message;
    }),
  );

  return messages.filter(Boolean);
}

export async function getDocumentCount() {
  const kbs = await redis.smembers('knowledgebases');
  let count = 0;
  console.debug('Knowledge Bases:', kbs);
  for (const kb of kbs) {
    const docCount = await redis.scard(`${kb}_documents`);
    count += docCount;
  }

  return count;
}

export async function getChatSessionCount() {
  return await redis.scard('chatsessions');
}