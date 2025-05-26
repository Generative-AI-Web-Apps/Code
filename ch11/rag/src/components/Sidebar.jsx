'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, MessageSquare, Home } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed top-0 left-0 w-60 h-screen bg-white border-r flex flex-col overflow-y-auto">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center">
          <span className="ml-2 font-bold text-gray-800">RAG Assistant</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className={`flex items-center p-2 rounded-md ${
                isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home size={20} className="mr-3" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/knowledgebase"
              className={`flex items-center p-2 rounded-md ${
                isActive('/knowledgebase') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Database size={20} className="mr-3" />
              <span>Knowledge Base</span>
            </Link>
          </li>
          <li>
            <Link
              href="/chat"
              className={`flex items-center p-2 rounded-md ${
                isActive('/chat') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare size={20} className="mr-3" />
              <span>Chat</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t">
        <SignOutButton className="text-red-600 hover:text-red-800 flex items-center">
          Sign Out
        </SignOutButton>
      </div>
    </div>
  );
}