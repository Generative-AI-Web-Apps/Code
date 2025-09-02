export async function streamComponent(input, history) {
  "use server";
  const result = await streamUI({
    model: google("models/gemini-2.5-flash"),
    messages: [...history, { role: "user", content: input }],
    text: ({ content, done }) => {
      return (
        <ChatBubble
          role="assistant"
          text={content}
          className={`mr-auto border-none`}
        />
      );
    },
  });

  return {
    id: generateId(),
    role: "assistant",
    display: result.value,
  };
}
