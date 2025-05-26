'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUIState, useActions } from 'ai/rsc';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendIcon } from 'lucide-react';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import AutoScroll from '@/components/AutoScroll';

export default function Chat() {
  const { knowledgebaseId } = useParams();
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kbInfo, setKbInfo] = useState(null);

  const [messages, setMessages] = useUIState();
  const { continueConversation } = useActions();

  useEffect(() => {
    async function fetchKnowledgeBase() {
      try {
        const response = await fetch(`/api/knowledgebase/${knowledgebaseId}`);
        if (response.ok) {
          const data = await response.json();
          setKbInfo(data);
        } else {
          console.error('Failed to fetch knowledge base info');
        }
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
      }
    }

    fetchKnowledgeBase();
  }, [knowledgebaseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!input.trim() || isLoading) return;
  
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
  
    // Add user message
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now().toString(),
        display: (
          <div className="flex justify-end mb-4">
            <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-md">{userInput}</div>
          </div>
        ),
        role: 'user',
      },
    ]);
  
    try {
      const message = await continueConversation(userInput, decodeURIComponent(knowledgebaseId));
  
      // Append assistant's response message to messages state
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now().toString() + '-assistant',
          display: (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 rounded-lg py-2 px-4 max-w-md">{message.content || message.display || message}</div>
            </div>
          ),
          role: 'assistant',
          content: message.content || message.display || message,
        },
      ]);
    } catch (error) {
      console.error('Error in conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 px-4">
      {messages.length === 0 && (
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold leading-tight mt-4 mb-4">
            <div className="inline-block">Knowledge Base Chat</div>
          </h1>
          {kbInfo && <p className="text-xl text-gray-600">{kbInfo.name}</p>}
          <p className="text-gray-400 mt-4">Ask questions about documents in this knowledge base</p>
        </div>
      )}

      <div className="border rounded-lg p-6 min-h-96">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <p className="font-medium">{message.role === 'user' ? 'You' : 'Assistant'}</p>
                <div className="p-3 rounded-lg bg-gray-100">{message.display || message.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Ask a question to get started</p>
          </div>
        )}
      </div>

      <form
        className="fixed bottom-0 left-0 right-0 w-full max-w-4xl mx-auto p-4 bg-white border-t"
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center space-x-2">
          <Textarea
            ref={inputRef}
            className="flex-1 p-2 border border-gray-300 rounded shadow-sm"
            placeholder="Ask a question about this knowledge base..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxRows={5}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="p-2">
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </form>
      <AutoScroll trackVisibility />
    </div>
  );
}
