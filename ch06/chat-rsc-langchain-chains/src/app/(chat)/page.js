'use client';

import { useState, useRef, useEffect } from 'react';
import { useActions, useUIState } from 'ai/rsc';
import ChatList from '@/components/chat/ChatList';
import { Textarea } from '@/components/ui/textarea';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import { generateId } from 'ai';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsloading] = useState(false);
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();

  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const messageEndRef = useRef(null);
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    const value = input.trim();
    setInput('');
    if (!value) return;
    setIsloading(true);
    setConversation((currentConversation) => [
      ...currentConversation,
      { id: generateId(), role: 'user', display: value },
    ]);
    const message = await continueConversation(value);
    setConversation((currentConversation) => [...currentConversation, message]);
    setIsloading(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 mx-auto stretch">
      {conversation.length > 0 && <ChatList messages={conversation} isLoading={isLoading} />}
      <div ref={messageEndRef}></div>
      <form
        className="stretch max-w-4xl flex flex-row"
        ref={formRef}
        role="form"
        aria-labelledby="chat-form-label"
        onSubmit={handleOnSubmit}
      >
        <div className="fixed bottom-0 w-full max-w-4xl p-2 mb-8 border border-gray-300 rounded shadow-xl">
          <Textarea
            ref={inputRef}
            className="w-full resize-none"
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
        </div>
      </form>
    </div>
  );
}
