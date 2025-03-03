import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../../backendUrl";
import { toast } from "react-hot-toast";
import type { Transaction } from "../../types";

interface FormData {
  id: string;
  customerEmail: string;
  companyName: string;
  amount: string;
  status: "pending" | "completed" | "cancelled";
}

interface UpdateTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction;
  onClose: () => void;
  onUpdateTransaction: (updatedTransaction: Transaction) => void;
}

const UpdateTransactionModal: React.FC<UpdateTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onUpdateTransaction,
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: transaction.id,
    customerEmail: transaction.customerEmail,
    companyName: transaction.companyName,
    amount: transaction.amount.toString(),
    status: transaction.status,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: transaction.id,
        customerEmail: transaction.customerEmail,
        companyName: transaction.companyName,
        amount: transaction.amount.toString(),
        status: transaction.status,
      });
    }
  }, [isOpen, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const res = await axios.put(`${BACKEND_URL}/api/transactions`, formData, {
        headers: {
          authorization: localStorage.getItem("token"),
        },
      });

      if (res.data.status === true) {
        toast.success("Transaction updated successfully!");
        onUpdateTransaction(res.data.transaction);
        onClose();
      } else {
        toast.error("Failed to update transaction.");
      }
    } catch (error) {
      toast.error("Error while updating transaction.");
      console.error("Error while updating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Update Transaction</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer's Email *
              </label>
              <input
                required
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, customerEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company's Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value || "0" })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "pending" | "completed" | "cancelled",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
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
                'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTransactionModal;
