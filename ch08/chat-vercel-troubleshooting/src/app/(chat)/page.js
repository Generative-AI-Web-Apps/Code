'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useActions, useUIState } from 'ai/rsc';
import ChatList from '@/components/chat/ChatList';
import { Textarea } from '@/components/ui/textarea';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import { generateId } from 'ai';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { logger } from '@/lib/logger';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google AI' },
];

const models = {
  openai: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5-turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
  ],
  google: [{ value: 'models/gemini-1.5-pro-latest', label: 'Gemini Pro' }],
};

export default function Home() {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-3.5-turbo');

  const handleProviderChange = (value) => {
    logger.info('Provider changed', { newProvider: value });
    setProvider(value);
    setModel(models[value][0].value);
  };

  const handleModelChange = (value) => {
    logger.info('Model changed', { newModel: value });
    setModel(value);
  };

  const [input, setInput] = useState('');
  const [isLoading, setIsloading] = useState(false);
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();

  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const messageEndRef = useRef(null);
  
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const handleInputChange = (event) => {
    setInput(event.target.value);
    logger.debug('Input changed', { inputValue: event.target.value });
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return; // Exit if there's no input

    logger.info('User submitted input', { inputValue: value }); 
    setInput('');
    setIsloading(true);

    setConversation((currentConversation) => [
      ...currentConversation,
      { id: generateId(), role: 'user', display: value },
    ]);

    try {
      const message = await continueConversation(value, provider, model); // Call AI function to continue conversation
      setConversation((currentConversation) => [...currentConversation, message]); // Add assistant message to conversation history
      logger.info('Assistant response received', { assistantMessage: message }); // Log assistant response
    } catch (error) {
      logger.error('Error during conversation continuation', { error: error.message }); // Log any errors encountered
    } finally {
      setIsloading(false); // Reset loading state after processing is complete
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, scrollToBottom]);

  return (
    <>
      <div className="flex justify-end gap-4 px-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="btn">Provider: {providers.find((p) => p.value === provider)?.label}</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {providers.map((p) => (
              <DropdownMenuItem key={p.value} onSelect={() => handleProviderChange(p.value)}>
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="btn">Model: {models[provider].find((m) => m.value === model)?.label}</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {models[provider].map((m) => (
              <DropdownMenuItem key={m.value} onSelect={() => handleModelChange(m.value)}>
                {m.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col w-full max-w-4xl mx-auto py-24 mx-auto stretch">
        {conversation.length > 0 && <ChatList messages={conversation} isLoading={isLoading} />}
        <div ref={messageEndRef}></div> {/* Ref for scrolling to the end of chat messages */}
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
              onChange={handleInputChange} // Handle changes in textarea input
              onKeyDown={onKeyDown} // Handle key down events for form submission
            />
          </div>
        </form>
      </div>
    </>
  );
}