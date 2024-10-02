'use client';

import { useState, useRef, useEffect } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { Textarea } from '@/components/ui/textarea';
import ChatList from '@/components/chat/ChatList';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import { continueConversation } from './actions';
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

const Chat = () => {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4');

  const handleProviderChange = (value) => {
    setProvider(value);
    setModel(models[value][0].value);
  };

  const handleModelChange = (value) => {
    setModel(value);
  };

  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const [isLoading, setIsloading] = useState(false);
  const [conversationMessages, setMessages] = useState([]);
  const [input, setInput] = useState('');
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
    setMessages([...conversationMessages, { role: 'user', content: input }]);
    const { messages, newMessage } = await continueConversation([
      ...conversationMessages,
      { role: 'user', content: input },
    ], provider, model);
    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setMessages([...messages, { role: 'assistant', content: textContent }]);
    }
    setIsloading(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

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
      <div className="flex flex-col w-full max-w-4xl mx-auto py-24 mx-auto stretch overflow-hidden">
        {conversationMessages.length === 0 && (
          <h1 className="text-6xl font-semibold leading-tight mt-4 mb-16">
            <div className="inline-block">Hello, I'm ✴️ Astra</div>
            <br />
            <span className="text-gray-400">Ask me anything you want</span>
          </h1>
        )}
        {conversationMessages.length > 0 && (
          <>
            <ChatList messages={conversationMessages} isLoading={isLoading} />
          </>
        )}
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
};

export default Chat;
