import React, { useState } from 'react';
import { FiUpload } from 'react-icons/fi';

const FileUploader = ({ fileName, onFileUpload, maxFileSize = 4 * 1024 * 1024 }) => {
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile && selectedFile.size > maxFileSize) {
      setError(`File size exceeds the maximum limit of ${maxFileSize / (1024 * 1024)} MB.`);
      return;
    }

    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    try {
      const base64 = await fileToBase64(selectedFile);
      onFileUpload(selectedFile, base64);
    } catch (error) {
      setError('Error uploading file.');
    }
  };

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = function (error) {
        reject(error);
      };
    });
  }

  return (
    <div>
      <label htmlFor="file-upload" className="file-upload-button flex">
        <FiUpload size={24} className="cursor-pointer" />
        <span className="file-upload-text" style={{ marginLeft: '8px' }}>
          {fileName ? fileName : "Choose a file" }
        </span>
        <input id="file-upload" type="file" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default FileUploader;