import React, { useState, useEffect } from "react";
import {
  FiFile,
  FiDownload,
  FiEye,
  FiX,
  FiTrash2,
  FiAlertCircle,
  FiFileText,
  FiImage,
  FiPenTool,
  FiGrid,
} from "react-icons/fi";
import axios from "axios";
import { BACKEND_URL } from "../../../backendUrl";
import toast from "react-hot-toast";

// Updated interface to match actual backend data
interface Document {
  id: string;
  fileName: string;
  filePath: string; // This is the actual property from backend
  cloudinaryId: string;
  customerId: string;
  createdAt?: string; // For upload date
  updatedAt?: string;
}

interface DocumentViewerProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchDocuments();
    }
    return () => {
      // Cleanup when component unmounts
      setPreviewDocument(null);
      setDocumentToDelete(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customerId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/customer/docs/get-documents/${customerId}`,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
          },
        }
      );

      if (response.data.status) {
        setDocuments(response.data.documents);
      } else {
        setError("Failed to load documents");
      }
    } catch (err) {
      setError("Error loading documents. Please try again.");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to determine file type from file name/path
  const getFileType = (doc: Document): string => {
    const fileName = doc.fileName.toLowerCase();
    const filePath = doc.filePath.toLowerCase();
    
    if (fileName.endsWith('.pdf') || filePath.includes('/pdf/')) {
      return 'application/pdf';
    } else if (/\.(jpe?g|png|gif|bmp|webp)$/i.test(fileName) || /\.(jpe?g|png|gif|bmp|webp)$/i.test(filePath)) {
      return 'image/jpeg';
    } else if (/\.(docx?|odt)$/i.test(fileName)) {
      return 'application/msword';
    } else if (/\.(xlsx?|ods)$/i.test(fileName)) {
      return 'application/excel';
    } else {
      return 'application/octet-stream';
    }
  };

  const canPreviewFile = (doc: Document): boolean => {
    const fileType = getFileType(doc);
    return fileType.includes("image") || fileType.includes("pdf");
  };

  const handlePreviewDocument = async (document: Document) => {
    // Only allow preview if file is an image or PDF
    if (!canPreviewFile(document)) {
      setPreviewError(true);
      setPreviewDocument(document);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(false);
    setPreviewDocument(document);

    try {
      // For images and PDFs, we try to preload them
      const response = await fetch(document.filePath);
      if (!response.ok) {
        throw new Error("File cannot be accessed");
      }
    } catch (err) {
      console.error("Error checking file accessibility:", err);
      setPreviewError(true);
    } finally {
      setTimeout(() => {
        setPreviewLoading(false);
      }, 600);
    }
  };

  const closePreview = () => {
    setPreviewDocument(null);
    setPreviewError(false);
  };

  const openDeleteConfirm = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDocumentToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/customer/docs/delete-document`,
        {
          data: { documentId: documentToDelete.id },
          headers: {
            authorization: localStorage.getItem("token"),
          },
        }
      );

      if (response.data.status) {
        // Remove deleted document from list
        setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id));

        // If the deleted document is currently being previewed, close the preview
        if (previewDocument && previewDocument.id === documentToDelete.id) {
          closePreview();
        }

        closeDeleteConfirm();
        toast.success("Document deleted successfully");
      } else {
        setError("Failed to delete document");
        toast.error("Failed to delete document");
      }
    } catch (err) {
      setError("Error deleting document. Please try again.");
      toast.error("Error deleting document. Please try again.");
      console.error("Error deleting document:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>, doc: Document) => {
    e.preventDefault();
    
    // Create a loading indicator
    const loadingToast = toast.loading("Downloading document...");
    
    // Use XMLHttpRequest for better progress handling
    const xhr = new XMLHttpRequest();
    xhr.open('GET', doc.filePath, true);
    xhr.responseType = 'blob';
    
    // Handle successful download
    xhr.onload = function() {
      if (this.status === 200) {
        const blob = new Blob([this.response], { type: getFileType(doc) });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Ensure proper filename with extension
        let fileName = doc.fileName;
        
        // Make sure filename has extension
        if (!fileName.includes('.')) {
          const fileType = getFileType(doc);
          const extension = fileType.split('/')[1] || 'file';
          fileName = `${fileName}.${extension}`;
        }
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.dismiss(loadingToast);
        toast.success("Download successful");
      } else {
        toast.dismiss(loadingToast);
        toast.error("Download failed. Please try again.");
      }
    };
    
    // Handle download errors
    xhr.onerror = function() {
      toast.dismiss(loadingToast);
      toast.error("Error downloading file. Please try again.");
      console.error('Error downloading file:', xhr.statusText);
    };
    
    xhr.send();
  };

  const getFileIcon = (doc: Document) => {
    const fileType = getFileType(doc);

    if (fileType.includes("pdf")) {
      return (
        <div className="w-8 h-10 bg-red-100 text-red-600 flex items-center justify-center rounded text-xs font-medium">
          <FiFileText size={16} />
        </div>
      );
    } else if (fileType.includes("image")) {
      return (
        <div className="w-8 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded text-xs font-medium">
          <FiImage size={16} />
        </div>
      );
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return (
        <div className="w-8 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded text-xs font-medium">
          <FiPenTool size={16} />
        </div>
      );
    } else if (fileType.includes("excel") || fileType.includes("sheet")) {
      return (
        <div className="w-8 h-10 bg-green-100 text-green-600 flex items-center justify-center rounded text-xs font-medium">
          <FiGrid size={16} />
        </div>
      );
    } else {
      return (
        <div className="w-8 h-10 bg-gray-100 text-gray-600 flex items-center justify-center rounded text-xs font-medium">
          <FiFile size={16} />
        </div>
      );
    }
  };

  // Since we don't have file size info from backend, we'll just show date
  const getFileInfo = (doc: Document): string => {
    const fileType = getFileType(doc);
    const date = doc.createdAt || doc.updatedAt || new Date().toISOString();
    return `${fileType.split('/').pop()?.toUpperCase() || 'FILE'} • ${new Date(date).toLocaleDateString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 bg-orange-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Client Documents
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-orange-100 hover:text-orange-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-600">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6">
              <p className="text-red-500 mb-3 text-sm">{error}</p>
              <button
                onClick={fetchDocuments}
                className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 shadow-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-14 h-14 mx-auto bg-orange-50 rounded-full flex items-center justify-center">
                <FiFile size={24} className="text-orange-400" />
              </div>
              <p className="mt-3 text-gray-500 text-sm">
                No documents found for this client
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center p-3 border border-gray-100 rounded-md hover:bg-orange-50 transition-colors shadow-sm"
                >
                  {getFileIcon(doc)}

                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm">
                      {doc.fileName}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      {getFileInfo(doc)}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {canPreviewFile(doc) && (
                      <button
                        onClick={() => handlePreviewDocument(doc)}
                        className="w-8 h-8 text-gray-600 hover:bg-black hover:text-white rounded-full flex items-center justify-center transition-colors mx-1"
                        title="Preview"
                      >
                        <FiEye size={15} />
                      </button>
                    )}
                    <a
                      href="#"
                      onClick={(e) => handleDownload(e, doc)}
                      className="w-8 h-8 text-gray-600 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center transition-colors mx-1"
                      title="Download"
                    >
                      <FiDownload size={15} />
                    </a>
                    <button
                      onClick={() => openDeleteConfirm(doc)}
                      className="w-8 h-8 text-gray-600 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-colors mx-1"
                      title="Delete"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 bg-orange-50">
              <h3 className="text-base font-medium truncate max-w-lg">
                {previewDocument.fileName}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDeleteConfirm(previewDocument)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1 transition-colors text-xs"
                >
                  <FiTrash2 size={14} />
                  <span>Delete</span>
                </button>
                <a
                  href="#"
                  onClick={(e) => handleDownload(e, previewDocument)}
                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 flex items-center gap-1 transition-colors text-xs"
                >
                  <FiDownload size={14} />
                  <span>Download</span>
                </a>
                <button
                  onClick={closePreview}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : canPreviewFile(previewDocument) && !previewError ? (
                <div className="bg-white shadow rounded-lg h-full flex items-center justify-center">
                  {getFileType(previewDocument).includes("image") ? (
                    <img
                      src={previewDocument.filePath}
                      alt={previewDocument.fileName}
                      className="max-w-full max-h-full object-contain"
                      onError={() => setPreviewError(true)}
                    />
                  ) : getFileType(previewDocument).includes("pdf") ? (
                    <iframe
                      src={`${previewDocument.filePath}#view=FitH`}
                      title={previewDocument.fileName}
                      className="w-full h-full"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-14 h-14 mx-auto bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                        <FiFile size={24} />
                      </div>
                      <h4 className="mt-3 text-base font-medium">
                        {previewDocument.fileName}
                      </h4>
                      <p className="mt-2 text-gray-500 text-sm">
                        This file type cannot be previewed. Please download the file to view it.
                      </p>
                      <a
                        href="#"
                        onClick={(e) => handleDownload(e, previewDocument)}
                        className="mt-4 px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 inline-flex items-center gap-1.5 text-sm shadow-sm"
                      >
                        <FiDownload size={16} />
                        <span>Download File</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-white shadow rounded-lg">
                  <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-4">
                    <FiFile size={32} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    {previewDocument.fileName}
                  </h4>
                  <p className="mt-2 text-gray-600 text-center max-w-md px-6">
                    {previewError 
                      ? "There was an error loading this file. The file may be corrupted or unavailable." 
                      : "This file type cannot be previewed directly in the browser."}
                  </p>
                  <div className="mt-6">
                    <a
                      href="#"
                      onClick={(e) => handleDownload(e, previewDocument)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 inline-flex items-center gap-2 shadow-sm"
                    >
                      <FiDownload size={18} />
                      <span>Download File</span>
                    </a>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    {getFileType(previewDocument).split('/')[1]?.toUpperCase() || 'FILE'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-center text-red-500 mb-4">
              <FiAlertCircle size={24} className="mr-3" />
              <h3 className="text-lg font-medium">Delete Document</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">{documentToDelete.fileName}</span>?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirm}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2 text-sm shadow-sm"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 size={16} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;