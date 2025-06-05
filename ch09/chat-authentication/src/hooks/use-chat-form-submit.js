'use client';
import { useState } from 'react';
import { generateUniqueId } from '@/lib/generateUniqueId';

function useChatFormSubmit(getAssistantResponse) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    setIsLoading(true);
    setInputValue('');
    setErrorMessage('');

    const userMessage = {
      content: value,
      role: 'user',
      id: generateUniqueId(),
    };
    setMessages((currentMessages) => [...currentMessages, userMessage]);

    try {
      const response = await getAssistantResponse(value);
      if (response.error) {
        setErrorMessage(response.error);
      } else {
        setMessages((currentMessages) => [...currentMessages, response.message]);
      }
    } catch (error) {
      if (error.status === 429 || error.message.includes('429')) {
        setErrorMessage('Message quota exceeded. You can only send 10 messages per day.');
      } else {
        console.error(error);
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, handleSubmit, inputValue, setInputValue, errorMessage };
}

export default useChatFormSubmit;
