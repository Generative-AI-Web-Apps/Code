'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export default function ChatButton({ knowledgeBaseId }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  
  const startNewChat = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Chat ${new Date().toLocaleString()}`,
          knowledgeBaseId: knowledgeBaseId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }
      
      const data = await response.json();
      router.push(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating chat session:', error);
      setIsCreating(false);
    }
  };
  
  return (
    <button
      onClick={startNewChat}
      disabled={isCreating}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center text-sm"
    >
      <MessageSquare size={16} className="mr-1" />
      {isCreating ? 'Starting chat...' : 'Start Chat'}
    </button>
  );
}