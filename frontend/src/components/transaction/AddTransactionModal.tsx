import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../backendUrl';
import { toast } from 'react-hot-toast';
import { useTransactions } from '../../context/TransactionContext';
import { useCompany } from '../../context/companyContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    customerEmail: '',
    totalAmount: '',
    paidAmount: '',
    status: 'pending',
    payment_type: 'online'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { setTransactions } = useTransactions();
  const { selectedCompany  } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        totalAmount: Number(formData.totalAmount),
        paidAmount: Number(formData.paidAmount),
        companyName: selectedCompany?.name.toLowerCase() || " "
      };
      console.log(payload);
      const res = await axios.post(`${BACKEND_URL}/api/transactions`, payload, {
        headers: {
          authorization: localStorage.getItem('token')
        }
      });
      if (res.status === 201) {
        toast.success('Transaction added successfully!');
        setTransactions((prevTransactions) => [...prevTransactions, res.data.transaction]);
        onClose();
      } else {
        toast.error('Failed to add transaction.');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error while adding transaction.';
      toast.error(Array.isArray(errorMessage) ? errorMessage[0].message : errorMessage);
      console.error('Error while adding transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 border border-orange-500">
        <div className="flex justify-between items-center mb-4 border-b border-orange-300 pb-3">
          <h2 className="text-xl font-semibold text-black">Add New Transaction</h2>
          <button onClick={onClose} className="p-1 hover:bg-orange-100 rounded text-black">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Customer's Email *
              </label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Total Amount *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Paid Amount *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Payment Type *
              </label>
              <select
                required
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="online">Online</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-black border border-orange-500 hover:bg-orange-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
              ) : (
                'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;