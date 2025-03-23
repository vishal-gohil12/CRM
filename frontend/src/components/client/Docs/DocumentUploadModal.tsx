import React, { useState } from 'react';
import {FiPaperclip } from 'react-icons/fi';
import axios from 'axios';
import { BACKEND_URL } from '../../../backendUrl';
import toast from 'react-hot-toast';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onDocumentUploaded: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, customerId, onDocumentUploaded }) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [documentName, setDocumentName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const uploadDocument = async () => {
    if (!files || files.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append('customerId', customerId);
    formData.append('documentName', documentName || files[0].name);
    formData.append('file', files[0]);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/customer/docs/upload-document`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            authorization: localStorage.getItem('token')
          }
        }
      );

      if (response.data.status) {
        toast.success('Document uploaded successfully');
        onDocumentUploaded();
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to upload document');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Upload Document</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter document name (optional)"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              id="document-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="document-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <FiPaperclip className="text-orange-500 mb-2" size={24} />
              <span className="text-sm text-gray-600">
                {files && files.length > 0 
                  ? `Selected: ${files[0].name}`
                  : 'Click to select a file'}
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={uploadDocument}
            disabled={uploading || !files}
            className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
              uploading || !files ? 'bg-orange-300' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
};