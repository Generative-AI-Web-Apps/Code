'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [model, setModel] = useState('gpt-4');

  const handleProviderChange = (value) => {
    setProvider(value);
    setModel(models[value][0].value);
  };

  const handleModelChange = (value) => {
    setModel(value);
  };
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
    const message = await continueConversation(value, provider, model);
    setConversation((currentConversation) => [...currentConversation, message]);
    setIsloading(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

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
    </>
  );
}
