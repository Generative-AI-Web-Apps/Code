import ChatBubble from './ChatBubble';
import ChatBubbleLoading from './ChatBubbleLoading';

const ChatList = ({ messages, isLoading }) => {
  return (
    <ul className="flex flex-col gap-5">
      {messages.map((message) => (
        <li key={message?.id}>
          {message.role === 'user' ? (
            <ChatBubble role="user" text={message.display} className={`ml-auto border-none`} />
          ) : message.display}
        </li>
      ))}
      {isLoading ? (
        <li key={messages.length + 1}>
          <ChatBubbleLoading />
        </li>
      ) : null}
    </ul>
  );
};

export default ChatList;
