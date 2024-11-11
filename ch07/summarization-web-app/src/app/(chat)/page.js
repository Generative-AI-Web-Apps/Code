'use client';

import { useState, useRef, useEffect } from 'react';
import { useActions, useUIState } from 'ai/rsc';
import ChatList from '@/components/chat/ChatList';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import useEnterSubmit from '@/hooks/use-enter-submit';
import useFocusOnSlashPress from '@/hooks/use-focus-on-slash-press';
import { generateId } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default function Home() {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsloading] = useState(false);
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();
  const fileInputRef = useRef(null);
  
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useFocusOnSlashPress();
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
    setSelectedFile(null); // Clear any selected file when typing
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setSelectedFile(file);
      setInput(''); // Clear text input when file is selected
    } else {
      alert('Please upload only PDF or DOCX files');
      setSelectedFile(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedFile && !input.trim()) return;
    setIsloading(true);
    
    try {
      let response;
      if (selectedFile) {
        // Handle file submission
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        setConversation((currentConversation) => [
          ...currentConversation,
          { id: generateId(), role: 'user', display: `Uploaded file: ${selectedFile.name}` },
        ]);
        
        response = await continueConversation(formData);
      } else {
        // Handle text submission
        setConversation((currentConversation) => [
          ...currentConversation,
          { id: generateId(), role: 'user', display: input },
        ]);
        
        response = await continueConversation(input);
      }
      
      setConversation((currentConversation) => [...currentConversation, response]);
    } catch (error) {
      console.error('Error during submission:', error);
      // Handle error appropriately
    } finally {
      setIsloading(false);
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 mb-40">
      {conversation.length > 0 && <ChatList messages={conversation} isLoading={isLoading} />}
      <div ref={messageEndRef} />
      
      <Card className="fixed bottom-0 w-full max-w-4xl mb-8">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} ref={formRef}>
            <div className="space-y-4">
              <Textarea
                ref={inputRef}
                className="w-full min-h-[100px] p-4"
                placeholder={selectedFile ? `Selected file: ${selectedFile.name}` : "Paste your text here or upload a document..."}
                value={input}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                disabled={!!selectedFile}
              />
              
              <div className="flex gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
                
                <Button 
                  type="submit"
                  disabled={isLoading || (!input.trim() && !selectedFile)}
                  className="flex-1"
                >
                  {isLoading ? 'Processing...' : 'Summarize'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}