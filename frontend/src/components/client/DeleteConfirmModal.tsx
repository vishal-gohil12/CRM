import axios from "axios";
import React, { useState } from "react";
import { BACKEND_URL } from "../../backendUrl";
import toast from "react-hot-toast";
import { FiAlertCircle } from "react-icons/fi";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    customerName: string;
    onConfirmDelete: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    customerId, 
    customerName,
    onConfirmDelete 
  }) => {
    const [deleting, setDeleting] = useState<boolean>(false);
  
    const handleDelete = async () => {
      setDeleting(true);
      
      try {
        const response = await axios.delete(
          `${BACKEND_URL}/api/customer/delete`,
          {
            data:{ id: customerId},
            headers: { authorization: localStorage.getItem('token') }
          }
        );
  
        if (response.data.status) {
          toast.success('Customer deleted successfully');
          onConfirmDelete();
          onClose();
        } else {
          throw new Error(response.data.message || 'Failed to delete customer');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setDeleting(false);
      }
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertCircle className="text-red-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Delete Customer</h3>
          </div>
          
          <p className="mb-6 text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{customerName}</span>? This action cannot be undone.
          </p>
  
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                deleting ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {deleting ? 'Deleting...' : 'Delete Customer'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  