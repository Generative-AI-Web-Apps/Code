import Link from 'next/link';
import { 
  ChevronLeft, 
  FileText, 
  MessageSquare, 
  Upload, 
  Edit,
} from 'lucide-react';
import { 
  getKnowledgeBase, 
  getDocumentsByKnowledgeBase 
} from '@/lib/database';
import DeleteButton from './DeleteButton';
import DocumentList from './DocumentList';

export default async function KnowledgeBasePage({ params }) {
  const { id } = params;
  const fullId = decodeURIComponent(id);
  const knowledgeBase = await getKnowledgeBase(fullId);
  if (!knowledgeBase) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Knowledge base not found</h2>
          <p>The requested knowledge base doesn't exist or has been deleted.</p>
          <Link href="/knowledgebase" className="text-blue-600 hover:underline mt-2 inline-block">
            Return to knowledge bases
          </Link>
        </div>
      </div>
    );
  }
  
  const documents = await getDocumentsByKnowledgeBase(fullId);
  const formattedDate = new Date(parseInt(knowledgeBase.createdAt)).toLocaleDateString();
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <Link href="/knowledgebase" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
          <ChevronLeft size={16} className="mr-1" />
          Back to Knowledge Bases
        </Link>
      </nav>
      
      {/* Knowledge Base Header */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{knowledgeBase.name}</h1>
              <p className="text-gray-600 mb-3">
                {knowledgeBase.description || "No description provided"}
              </p>
              <p className="text-sm text-gray-500">Created on {formattedDate}</p>
            </div>
            
            <div className="flex space-x-2">
              <Link 
                href={`/knowledgebase/${id}/edit`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center text-sm"
              >
                <Edit size={16} className="mr-1" />
                Edit
              </Link>
              
              <DeleteButton knowledgeBaseId={id} />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="border-t px-6 py-4 bg-gray-50 flex flex-wrap gap-3">
          <Link 
            href={`/knowledgebase/${id}/upload`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center text-sm"
          >
            <Upload size={16} className="mr-1" />
            Upload Documents
          </Link>
          
          <Link 
            href={`/chat/${id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center text-sm"
          >
            <MessageSquare size={16} className="mr-1" />
            Start Chat
          </Link>
        </div>
      </div>
      
      {/* Documents Section */}
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FileText className="mr-2" size={20} />
        Documents ({documents.length})
      </h2>
      
      <DocumentList documents={documents} knowledgeBaseId={id} />
      
      {/* No Documents State */}
      {documents.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="bg-gray-100 inline-flex rounded-full p-3 mb-4">
            <FileText size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">
            Upload documents to start building your knowledge base and chat with your data.
          </p>
          <Link 
            href={`/knowledgebase/${id}/upload`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <Upload size={16} className="mr-2" />
            Upload Documents
          </Link>
        </div>
      )}
    </div>
  );
}