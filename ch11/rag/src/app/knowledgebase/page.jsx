import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { getAllKnowledgeBases } from '@/lib/database';

export default async function KnowledgeBasePage() {
  const knowledgebases = await getAllKnowledgeBases();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Bases</h1>
        <Link
          href="/knowledgebase/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="mr-2" size={16} />
          New Knowledge Base
        </Link>
      </div>

      {knowledgebases.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No Knowledge Bases Yet</h2>
          <p className="text-gray-600 mb-4">
            Create your first knowledge base to start organizing your documents.
          </p>
          <Link
            href="/knowledgebase/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
          >
            <PlusIcon className="mr-2" size={16} />
            Create Knowledge Base
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledgebases.map((kb) => (
            <Link
              href={`/knowledgebase/${kb.id}`}
              key={kb.id}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{kb.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {kb.description || 'No description provided'}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{kb._count.documents} documents</span>
                <span>
                  Updated {new Date(kb.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}