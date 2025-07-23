import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import ChatList from '@/components/chat/ChatList';
import useEnterSubmit from '@/hooks/use-enter-submit';
import AutoScroll from '@/components/AutoScroll';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import useChatFormSubmit from '@/hooks/use-chat-form-submit';
import { getAssistantResponse } from '@/lib/getAssistantResponse';

import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

const ChatPage = () => {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const { messages, isLoading, handleSubmit, inputValue, setInputValue } = useChatFormSubmit(getAssistantResponse);
  const onInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const mainScrollContainerRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);

  const handleScrollToTop = useCallback(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (mainScrollContainerRef.current) {
      const newIsAtTop = mainScrollContainerRef.current.scrollTop === 0;
      if (newIsAtTop !== isAtTop) {
        setIsAtTop(newIsAtTop);
      }
    }
  }, [isAtTop]);

  useEffect(() => {
    const container = mainScrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    <div
      ref={mainScrollContainerRef}
      className="flex flex-col w-full max-w-4xl mx-auto py-24 stretch h-screen relative overflow-y-auto"
    >
      {messages.length === 0 && (
        <h1 className="text-6xl font-semibold leading-tight mt-4 mb-16">
          <div className="inline-block">Hello, I'm ✴️ Astra</div>
          <br />
          <span className="text-gray-400">Ask me anything you want</span>
        </h1>
      )}
      {messages.length > 0 && <ChatList messages={messages} isLoading={isLoading} />}
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
          onChange={onInputChange}
          onKeyDown={onKeyDown}
        />
      </form>
      <AutoScroll trackVisibility />
      {!isAtTop && messages.length > 0 && (
        <Button
          onClick={handleScrollToTop}
          className="fixed top-32 right-8 p-3 rounded-full shadow-lg bg-blue-500 text-white hover:bg-blue-600 z-50"
          aria-label="Scroll to top of conversation"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ChatPage;