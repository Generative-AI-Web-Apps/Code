export async function processIncomingMessages(req) {
  const { messages, data } = await req.json();
  if (!data?.imageUrl) return messages;
  const initialMessages = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];
  return [
    ...initialMessages,
    {
      ...lastMessage,
      content: [
        { type: 'text', text: lastMessage.content },
        {
          type: 'image',
          image: data.imageUrl,
        },
      ],
    },
  ];
}
