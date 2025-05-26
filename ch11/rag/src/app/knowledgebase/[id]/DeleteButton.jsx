'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ knowledgeBaseId }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/knowledgebase/${knowledgeBaseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete knowledge base');
      }
      
      router.push('/knowledgebase');
      router.refresh();
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-md flex items-center text-sm"
      >
        <Trash2 size={16} className="mr-1" />
        Delete
      </button>
      
      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Knowledge Base</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this knowledge base? This will also delete all associated documents and chat sessions. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}