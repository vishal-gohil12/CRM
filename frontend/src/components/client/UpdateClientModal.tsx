import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast'; 
import axios from 'axios';
import { BACKEND_URL } from '../../backendUrl';
import { Client } from '../../types';

interface UpdateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: (client: Client) => void;
  client: Client;
}

const UpdateClientModal: React.FC<UpdateClientModalProps> = ({ isOpen, onClose, onClientUpdated, client }) => {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone,
    remark: client.remark || '',
    companyName: client.companyName,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      remark: client.remark || '',
      companyName: client.companyName,
    });
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.put(`${BACKEND_URL}/api/customer/update`, { id: client.id, ...formData }, {
        headers: {
          authorization: localStorage.getItem('token')
        }
      });

      if (response.data.status) {
        toast.success('Client updated successfully!');
        const updatedClient = {
          ...response.data.customer,
          companyName: response.data.customer.company?.name || formData.companyName
        };
        onClientUpdated(updatedClient);
        onClose();
      } else {
        toast.error('Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Update Client</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {['name', 'email', 'phone', 'remark', 'companyName'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1)} {field !== 'phone' && field !== 'remark' && '*'}
                </label>
                {field === 'remark' ? (
                  <textarea
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    rows={3}
                  />
                ) : (
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    required={field !== 'phone' && field !== 'address'}
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
              ) : (
                'Update Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateClientModal;
