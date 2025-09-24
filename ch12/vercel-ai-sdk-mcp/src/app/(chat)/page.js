'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import ChatList from '@/components/chat/ChatList';
import AutoScroll from '@/components/AutoScroll';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

function normalizeMessageParts(parts) {
  let text = '';

  parts.forEach((part) => {
    if (part.type === 'text') {
      text += part.text + ' ';
    } else if (part.type === 'dynamic-tool' && part.output?.content) {
      part.output.content.forEach((c) => {
        if (c.type === 'text') {
          text += c.text + ' ';
        }
      });
    }
  });

  return text.trim();
}

const Chat = () => {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const [inputValue, setInputValue] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/',
    }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Send user input to AI assistant
    sendMessage({ text: inputValue });
    setInputValue('');
  };
  const normalizedMessages = messages.map((msg) => ({
    ...msg,
    content: normalizeMessageParts(msg.parts),
  }));

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 stretch">
      {normalizedMessages.length === 0 && (
        <h1 className="text-6xl font-semibold leading-tight mt-4 mb-16">
          <div className="inline-block">Hello, I'm ✴️ Astra</div>
          <br />
          <span className="text-gray-400">Ask me anything you want</span>
        </h1>
      )}

      {normalizedMessages.length > 0 && <ChatList messages={normalizedMessages} isLoading={status === 'loading'} />}

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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={status !== 'ready'}
        />
      </form>
      <AutoScroll trackVisibility />
    </div>
  );
};

export default Chat;
