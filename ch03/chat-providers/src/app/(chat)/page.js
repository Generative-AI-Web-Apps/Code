'use client';
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import ChatList from '@/components/chat/ChatList';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';

import { useChat } from 'ai/react';
import { ScrollArea } from '@radix-ui/react-scroll-area';

const Chat = () => {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({ api: '/api' });
  
  const messageEndRef = React.useRef(null);
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 mx-auto stretch overflow-hidden">
      <ScrollArea className="relative mx-auto px-4 h-full pb-12 overflow-hidden">
        {messages.length === 0 && (
          <h1 className="text-6xl font-semibold leading-tight mt-4 mb-16">
            <div className="inline-block">Hello, I'm ✴️ Astra</div>
            <br />
            <span className="text-gray-400">Ask me anything you want</span>
          </h1>
        )}
        {messages.length > 0 && (
          <>
            <ChatList messages={messages} isLoading={isLoading} />
          </>
        )}
      </ScrollArea>
      <div ref={messageEndRef}></div>
      <form
        className="stretch max-w-4xl flex flex-row"
        ref={formRef}
        role="form"
        aria-labelledby="chat-form-label"
        onSubmit={handleSubmit}
      >
        <Textarea
          ref={inputRef}
          className="fixed bottom-0 w-full max-w-4xl p-2 mb-8 border border-gray-300 rounded shadow-xl"
          placeholder="Type your message here..."
          tabIndex={0}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
        />
      </form>

    </div>
  );
};

export default Chat;
