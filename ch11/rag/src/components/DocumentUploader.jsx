'use client';

import { useState, useRef } from 'react';
import { Upload, FileType, X, Check, AlertCircle } from 'lucide-react';

export default function DocumentUploader({ knowledgeBaseId, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ].includes(file.type),
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ].includes(file.type),
    );

    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('knowledgeBaseId', knowledgeBaseId);
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload documents');
      }

      const result = await response.json();
      setUploadStatus({ success: true, message: `Successfully uploaded ${result.count} documents` });
      setFiles([]);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ success: false, message: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700">Drag and drop your files here</h3>
          <p className="text-sm text-gray-500">
            or{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => fileInputRef.current.click()}
            >
              browse
            </button>{' '}
            to upload
          </p>
          <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX, TXT, MD</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Selected Files ({files.length})</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200"
              >
                <div className="flex items-center">
                  <FileType className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button type="button" onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={uploading}
              className={`flex items-center px-4 py-2 rounded-md text-white ${
                uploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  <span>
                    Upload {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {uploadStatus && (
        <div
          className={`mt-4 p-3 rounded-md ${
            uploadStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center">
            {uploadStatus.success ? <Check className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
            <span>{uploadStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
