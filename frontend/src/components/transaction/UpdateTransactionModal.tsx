import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useTransactions, Transaction } from "../../context/TransactionContext";
import { BACKEND_URL } from "../../backendUrl";
import axios from "axios";
import { motion } from "framer-motion";

interface UpdateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

// Using the Transaction type from the context
const UpdateTransactionModal = ({
  isOpen,
  onClose,
  transaction
}: UpdateTransactionModalProps) => {
  const [formData, setFormData] = useState<{
    customerName: string;
    companyName: string;
    totalAmount: number;
    paidAmount: number;
    status: "pending" | "completed" | "cancelled";
    payment_type: string;
  }>({
    customerName: "",
    companyName: "",
    totalAmount: 0,
    paidAmount: 0,
    status: "pending",
    payment_type: "cash"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Using the setTransactions from the context
  const { setTransactions } = useTransactions();

  useEffect(() => {
    if (transaction) {
      setFormData({
        customerName: transaction.customerName,
        companyName: transaction.companyName,
        totalAmount: transaction.totalAmount,
        paidAmount: transaction.paidAmount,
        status: transaction.status,
        payment_type: transaction.payment_type
      });
    }
  }, [transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: 
        name === "totalAmount" || name === "paidAmount" 
          ? Number(value) 
          : name === "status" 
            ? (value as "pending" | "completed" | "cancelled") 
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/transactions/${transaction.id}`,
        formData,
        {
          headers: {
            authorization: localStorage.getItem("token"),
          },
        }
      );

      if (response.data.status) {
        setSuccess(true);
        // Update the transactions with proper typing
        setTransactions((prev) =>
          prev.map((t) => (t.id === transaction.id ? {
            ...t,
            customerName: formData.customerName,
            companyName: formData.companyName,
            totalAmount: formData.totalAmount,
            paidAmount: formData.paidAmount,
            status: formData.status,
            payment_type: formData.payment_type,
            pendingAmount: formData.totalAmount - formData.paidAmount
          } : t))
        );
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(response.data.message || "Failed to update transaction");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Error updating transaction"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!isLoading) {
          onClose();
        }
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-xl bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Update Transaction
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    min="0"
                    max={formData.totalAmount}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-2 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-2 bg-green-50 text-green-600 rounded-lg text-sm"
                >
                  Transaction updated successfully!
                </motion.div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Transaction"
                  )}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default UpdateTransactionModal;