'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIState, useAIState, useActions } from 'ai/rsc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatBubble from '@/components/chat/ChatBubble';
import { isTTSEnabled } from '@/features/text-to-speach';
import { AlertCircle, Volume2, VolumeX } from 'lucide-react';

export default function ChatThread({ sessionId, initialMessages = [], isCompleted = false }) {
  const [aiState, setAIState] = useAIState();
  const [uiState, setUIState] = useUIState();
  const { continueConversationAndSave, completeInterviewSession } = useActions();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [featureTTSAvailable, setFeatureTTSAvailable] = useState(false);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentSessionIdRef = useRef(sessionId);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause(); // Pause the audio
      audioRef.current.currentTime = 0; // Reset the audio to the beginning
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPlaying(false);
  };

  const setAbortController = (controller) => {
    abortControllerRef.current = controller;
  };

  useEffect(() => {
    const ttsAvailable = isTTSEnabled();
    setFeatureTTSAvailable(ttsAvailable);
  

    const savedPreference = localStorage.getItem('feature_tts_enabled');
    setIsSpeechEnabled(savedPreference === 'true'); // Ensures correct boolean conversion
  }, []);

  const toggleSpeech = () => {
    const newState = !isSpeechEnabled;
    setIsSpeechEnabled(newState);
    localStorage.setItem('feature_tts_enabled', newState.toString());

    if (newState && featureTTSAvailable) {
      const lastAssistantMessage = [...uiState].reverse().find((msg) => msg.role === 'assistant');
      if (lastAssistantMessage) {
        speakMessage(lastAssistantMessage.content);
      }
    } else if (!newState && audioRef.current) {
      // If turning off speech, stop any playing audio
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  useEffect(() => {
    scrollToBottom();
  }, [uiState]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakMessage = async (text) => {
    if (!isSpeechEnabled || !featureTTSAvailable || !text.trim()) return;

    try {
      const controller = new AbortController();
      setAbortController(controller);
      setIsPlaying(true);

      // Call the Google TTS API through your backend proxy
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch((error) => {
          if (error.name === 'AbortError') {
            console.log('Playback stopped by user');
          } else {
            console.error('Playback failed', error);
          }
        });
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || completed) return;

    try {
      setIsLoading(true);

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        display: <ChatBubble role="user" text={input} className="ml-auto" />,
      };

      setUIState([...uiState, userMessage]);

      // Clear input
      setInput('');

      const response = await continueConversationAndSave(input, sessionId);

      if (response.role !== 'system') {
        setUIState((prev) => [...prev, response]);
      }
    } catch (error) {
      console.error('Error in chat submission:', error);

      // Show error message to user
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'There was an error processing your response. Please try again.',
        display: (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 mx-auto my-4 max-w-md">
            <AlertCircle size={18} />
            <span>There was an error processing your response. Please try again.</span>
          </div>
        ),
      };

      setUIState((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId !== currentSessionIdRef.current) {
      // Clear previous state when switching sessions
      setAIState([]);
      setUIState([]);
      currentSessionIdRef.current = sessionId;
    }

    // Process initialMessages
    if (initialMessages.length > 0) {
      const filteredMessages = initialMessages.filter((msg) => msg.role !== 'system');
      setAIState(filteredMessages);

      let hasIntroduction = filteredMessages.some((msg) => msg.role === 'assistant' && msg.content.length > 30);

      let initialUIState = filteredMessages.map((msg) => ({
        id: msg.id || `${msg.role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role,
        content: msg.content,
        display: (
          <ChatBubble
            role={msg.role}
            text={msg.content}
            className={msg.role === 'user' ? 'ml-auto' : 'mr-auto border-none'}
          />
        ),
      }));

      if (!hasIntroduction && initialUIState.length <= 1) {
        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'll be conducting your interview today. I'll ask you a series of questions to evaluate your skills and experience. Take your time to think through each question, and don't hesitate to ask for clarification if needed. Let's begin with the first question when you're ready.`,
          display: (
            <ChatBubble
              role="assistant"
              text={`Hello! I'll be conducting your interview today. I'll ask you a series of questions to evaluate your skills and experience. Take your time to think through each question, and don't hesitate to ask for clarification if needed. Let's begin with the first question when you're ready.`}
              className="mr-auto border-none"
            />
          ),
        };
        initialUIState = [welcomeMessage, ...initialUIState];
      }

      setUIState(initialUIState);
    }
  }, [sessionId, initialMessages, setAIState, setUIState]);

  // Function to complete interview session
  const handleCompleteSession = async () => {
    if (isLoading || uiState.length === 0) return;

    try {
      setIsLoading(true);
      await completeInterviewSession(sessionId);
      setCompleted(true);

      const completionMessage = {
        id: `completion-${Date.now()}`,
        role: 'system',
        content: 'Interview session completed. This interview is now locked and cannot be modified.',
        display: (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-center gap-2 mx-auto my-4 max-w-md">
            <AlertCircle size={18} />
            <span>Interview session completed and locked</span>
          </div>
        ),
      };

      setUIState((prev) => [...prev, completionMessage]);
    } catch (error) {
      console.error('Error completing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <audio ref={audioRef} onEnded={handleAudioEnded} onError={() => setIsPlaying(false)} className="hidden" />
      {completed && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p className="font-medium">This interview session has been completed</p>
          </div>
          <p className="mt-1">The interview is now locked and cannot be modified.</p>
        </div>
      )}

      {/* TTS controls */}
      {featureTTSAvailable && (
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSpeech}
            className={`flex items-center gap-1 ${isSpeechEnabled ? 'text-blue-600' : 'text-gray-500'}`}
            disabled={isPlaying || completed}
          >
            {isSpeechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="text-xs">{isSpeechEnabled ? 'Voice On' : 'Voice Off'}</span>
          </Button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-2 ${completed ? 'opacity-80' : ''}`}>
        {uiState.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            Your interview will begin when you send your first message
          </div>
        ) : (
          <div className="space-y-4">
            {uiState.map((message) => (
              <div key={message.id}>
                {message.display}
                {featureTTSAvailable && message.role === 'assistant' && isSpeechEnabled && (
                  <div className="flex justify-start ml-2 mt-1">
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          stopPlayback();
                        } else {
                          speakMessage(message.content);
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-blue-500 flex items-center"
                      disabled={completed}
                    >
                      <Volume2 size={14} className="mr-1" />
                      {isPlaying ? 'Stop' : 'Play'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="border-t mt-4 pt-4">
        {completed ? (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <AlertCircle className="text-yellow-500 mr-2" size={18} />
            <span className="text-gray-700 font-medium">
              This interview session has been completed and cannot be modified
            </span>
            &nbsp;
            <Link href={`/chat/${sessionId}/feedback`}>
              <b>View Feedback</b>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              disabled={isLoading || completed}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim() || completed}>
              Send
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              onClick={handleCompleteSession}
              disabled={isLoading || uiState.length === 0}
            >
              Complete Interview
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
