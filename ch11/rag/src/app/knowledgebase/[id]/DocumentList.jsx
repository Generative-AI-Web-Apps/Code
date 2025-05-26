'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, MoreHorizontal, Trash2 } from 'lucide-react';

export default function DocumentList({ documents, knowledgeBaseId }) {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, docId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const toggleMenu = (docId) => {
    setActiveMenu(activeMenu === docId ? null : docId);
  };
  
  const handleDeleteClick = (docId) => {
    setActiveMenu(null);
    setDeleteModal({ open: true, docId });
  };
  
  const handleDelete = async () => {
    if (!deleteModal.docId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/knowledgebase/${knowledgeBaseId}/document/${deleteModal.docId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Close modal and refresh the page data
      setDeleteModal({ open: false, docId: null });
      router.refresh();
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp)).toLocaleDateString();
  };
  
  const getFileTypeIcon = (fileType) => {
    return <FileText size={16} className="text-blue-600" />;
  };
  
  return (
    <div className="bg-white rounded-lg border overflow-hidden mb-6">
      {documents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Size</th>
                <th className="px-6 py-3 text-left">Uploaded</th>
                <th className="px-6 py-3 text-left">Chunks</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getFileTypeIcon(doc.fileType)}
                      <span className="ml-2 font-medium">{doc.originalName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {doc.fileType.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {doc._count?.chunks || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button 
                        onClick={() => toggleMenu(doc.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {activeMenu === doc.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={() => handleDeleteClick(doc.id)}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete document
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      
      {/* Delete Document Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Document</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This will remove the document and all its chunks from the knowledge base. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ open: false, docId: null })}
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
    </div>
  );
}