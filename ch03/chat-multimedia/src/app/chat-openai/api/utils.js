export async function processIncomingMessages(req) {
  const { messages, data } = await req.json();
  if (!data?.imageUrl) return messages;

  const lastMessage = messages[messages.length - 1];
  const content = [];

  if (typeof lastMessage.content === 'string') {
    content.push({ type: 'text', text: lastMessage.content });
  } else if (Array.isArray(lastMessage.content)) {
    content.push(...lastMessage.content);
  }

  content.push({
    type: 'image',
    image:
      typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http') ? new URL(data.imageUrl) : data.imageUrl,
  });

  return [
    ...messages.slice(0, -1),
    {
      role: lastMessage.role || 'user',
      content,
    },
  ];
}
