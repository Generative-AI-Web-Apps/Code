import Link from 'next/link';
import { PlusIcon, Database, Upload, MessageSquare, Info } from 'lucide-react';
import { getAllChatSessions, getAllKnowledgeBases } from '@/lib/database';

export default async function Dashboard() {
  // Fetch the knowledgebases and chat sessions count
  const knowledgebases = await getAllKnowledgeBases();
  const chatSessions = await getAllChatSessions();
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-blue-600 mb-2">Knowledge Assistant</h1>
              <p className="text-gray-600 text-sm">
                Your personal AI-powered knowledge hub for documents and conversations.
              </p>
            </div>
            <Link 
              href="/knowledgebase/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center text-sm"
            >
              <PlusIcon className="mr-1" size={16} />
              New Knowledge Base
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <Database className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <h2 className="text-2xl font-bold">{knowledgebases.length}</h2>
                <p className="text-gray-600 text-sm">Knowledge Bases</p>
              </div>
              <div className="ml-auto">
                <Link href="/knowledgebase" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                  View all
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <MessageSquare className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <h2 className="text-2xl font-bold">{chatSessions.length}</h2>
                <p className="text-gray-600 text-sm">Chat Sessions</p>
              </div>
              <div className="ml-auto">
                <Link href="/chat" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                  View all
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link href="/knowledgebase/new" className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Database className="text-blue-600" size={20} />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Create Knowledge Base</h3>
              <p className="text-gray-600 text-xs">
                Build a new AI-powered knowledge repository
              </p>
            </div>
          </Link>

          <Link href="/upload" className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Upload className="text-blue-600" size={20} />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Upload Documents</h3>
              <p className="text-gray-600 text-xs">
                Add PDF, DOCX, MD or TXT files
              </p>
            </div>
          </Link>

          <Link href="/chat" className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <MessageSquare className="text-blue-600" size={20} />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Start Chatting</h3>
              <p className="text-gray-600 text-xs">
                Get answers from your knowledge with AI
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}