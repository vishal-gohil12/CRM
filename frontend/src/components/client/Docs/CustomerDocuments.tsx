import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { BACKEND_URL } from '../../../backendUrl';
import { FiFile, FiDownload, FiTrash2, FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DocumentUploadModal } from './DocumentUploadModal';

interface Document {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface CustomerDocumentsProps {
  customerId: string;
  customerName: string;
}

export const CustomerDocuments: React.FC<CustomerDocumentsProps> = ({ customerId, customerName }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/document/get-documents/${customerId}`,
        {
          headers: {
            authorization: localStorage.getItem('token')
          }
        }
      );

      if (response.data.status) {
        setDocuments(response.data.documents);
      } else {
        toast.error('Failed to fetch documents');
      }
    } catch (error) {
      toast.error('Error retrieving documents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/document/delete-document`,
        {
          headers: {
            authorization: localStorage.getItem('token')
          },
          data: {
            customerId,
            documentId
          }
        }
      );

      if (response.data.status) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      toast.error('Error deleting document');
      console.error(error);
    }
  };

  const handleDownload = (document: Document) => {
    window.open(`${BACKEND_URL}${document.path}`, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileTypeIcon = (type: string): React.ReactNode => {
    if (type.includes('pdf')) return <FiFile className="text-red-500" />;
    if (type.includes('image')) return <FiFile className="text-blue-500" />;
    if (type.includes('word') || type.includes('document')) return <FiFile className="text-indigo-500" />;
    if (type.includes('excel') || type.includes('sheet')) return <FiFile className="text-green-500" />;
    return <FiFile className="text-gray-500" />;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    
    if (filterType === 'pdf' && doc.type.includes('pdf')) return matchesSearch;
    if (filterType === 'image' && doc.type.includes('image')) return matchesSearch;
    if (filterType === 'document' && (doc.type.includes('word') || doc.type.includes('document'))) return matchesSearch;
    if (filterType === 'spreadsheet' && (doc.type.includes('excel') || doc.type.includes('sheet'))) return matchesSearch;
    
    return false;
  });

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {customerName}'s Documents
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <FiPlus /> Upload Document
        </button>
      </div>

      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none pl-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-8 bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Files</option>
              <option value="pdf">PDF</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="spreadsheet">Spreadsheets</option>
            </select>
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            {searchQuery || filterType !== 'all' 
              ? "No documents match your search criteria" 
              : "No documents uploaded yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredDocuments.map((doc) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                            {getFileTypeIcon(doc.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{doc.type.split('/').pop()?.toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatFileSize(doc.size)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FiDownload className="inline-block" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="inline-block" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        customerId={customerId}
        onDocumentUploaded={fetchDocuments}
      />
    </div>
  );
};