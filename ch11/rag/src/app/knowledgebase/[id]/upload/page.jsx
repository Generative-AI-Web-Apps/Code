'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database } from 'lucide-react';
import Link from 'next/link';
import DocumentUploader from '@/components/DocumentUploader';

export default function UploadPage({ params }) {
  const { id: knowledgeBaseId } = params;
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchKnowledgeBase() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/knowledgebase/${knowledgeBaseId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch knowledge base');
        }
        
        const data = await response.json();
        setKnowledgeBase(data);
      } catch (err) {
        console.error('Error fetching knowledge base:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (knowledgeBaseId) {
      fetchKnowledgeBase();
    }
  }, [knowledgeBaseId]);

  const handleUploadSuccess = () => {
    // Show success message or redirect after brief delay
    setTimeout(() => {
      router.push(`/knowledgebase/${knowledgeBaseId}`);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg font-medium text-gray-700">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-800">Error</h2>
          <p className="text-red-700">{error}</p>
          <div className="mt-4">
            <Link 
              href="/knowledgebase" 
              className="inline-flex items-center rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Bases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center">
        <Link 
          href={`/knowledgebase/${knowledgeBaseId}`}
          className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
      </div>

      {knowledgeBase && (
        <div className="mb-6 flex items-center space-x-3 rounded-md bg-blue-50 p-4">
          <Database className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="font-medium text-blue-900">{knowledgeBase.name}</h2>
            <p className="text-sm text-blue-700">
              Uploading to knowledge base: {knowledgeBase.description || 'No description'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="mb-1 text-lg font-medium text-gray-900">Upload Documents</h2>
          <p className="text-sm text-gray-600">
            Upload documents to add to your knowledge base. Supported formats include PDF, DOCX, TXT, and MD files.
          </p>
        </div>

        <DocumentUploader 
          knowledgeBaseId={knowledgeBaseId} 
          onUploadSuccess={handleUploadSuccess} 
        />

        <div className="mt-8 rounded-md bg-yellow-50 p-4">
          <h3 className="font-medium text-yellow-800">Important Notes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-700">
            <li>Large documents may take some time to process</li>
            <li>Documents are processed in the background and will be available shortly after upload</li>
            <li>Maximum file size per document: 10MB</li>
            <li>For best results, ensure your documents are properly formatted</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Link
          href={`/knowledgebase/${knowledgeBaseId}`}
          className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Knowledge Base
        </Link>
      </div>
    </div>
  );
}