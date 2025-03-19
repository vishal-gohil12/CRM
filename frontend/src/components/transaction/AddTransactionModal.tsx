/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTransactions } from "../../context/TransactionContext";
import { useCompany } from "../../context/companyContext";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    customerEmail: "",
    totalAmount: "",
    paidAmount: "",
    status: "pending",
    payment_type: "online",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAmount, setPendingAmount] = useState("0.00");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  const { addTransaction } = useTransactions();
  const { selectedCompany } = useCompany();

  // Calculate pending amount whenever total or paid amount changes
  useEffect(() => {
    const total = parseFloat(formData.totalAmount) || 0;
    const paid = parseFloat(formData.paidAmount) || 0;
    const pending = Math.max(0, total - paid).toFixed(2);
    setPendingAmount(pending);
  }, [formData.totalAmount, formData.paidAmount]);

  // Verify customer email with debounce
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.customerEmail || !formData.customerEmail.includes('@')) {
        setEmailVerified(null);
        return;
      }

      setEmailCheckLoading(true);
      try {
        // Simulating backend validation - replace with actual API call
        setTimeout(() => {
          setEmailVerified(true);
          setEmailCheckLoading(false);
        }, 800);
      } catch (error) {
        setEmailVerified(false);
        setEmailCheckLoading(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.customerEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.customerEmail || !formData.totalAmount || !formData.paidAmount) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        customerEmail: formData.customerEmail,
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: parseFloat(formData.paidAmount),
        status: formData.status as "pending" | "completed" | "cancelled",
        payment_type: formData.payment_type,
        companyName: selectedCompany?.name.toLowerCase() || "",
      };

      const success = await addTransaction(payload);
      
      if (success) {
        toast.success("Transaction added successfully!");
        onClose();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to add transaction. Please try again.");
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerEmail: "",
      totalAmount: "",
      paidAmount: "",
      status: "pending",
      payment_type: "online",
    });
    setEmailVerified(null);
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    const paidAmount = parseFloat(value) || 0;
    
    // Ensure paid amount doesn't exceed total amount
    if (paidAmount > totalAmount) {
      setFormData({ ...formData, paidAmount: formData.totalAmount });
    } else {
      setFormData({ ...formData, paidAmount: value });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl border border-orange-500 transform transition-all">
        <div className="flex justify-between items-center mb-4 border-b border-orange-300 pb-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Add New Transaction
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer's Email *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  emailVerified === true
                    ? "border-green-300 focus:ring-green-200"
                    : emailVerified === false
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-orange-200"
                }`}
                placeholder="customer@example.com"
              />
              {emailCheckLoading ? (
                <Loader2 size={18} className="absolute right-3 top-3 text-gray-400 animate-spin" />
              ) : emailVerified === true ? (
                <Check size={18} className="absolute right-3 top-3 text-green-500" />
              ) : emailVerified === false ? (
                <AlertCircle size={18} className="absolute right-3 top-3 text-red-500" />
              ) : null}
            </div>
            {selectedCompany && (
              <p className="text-xs text-gray-500 mt-1">
                Transaction will be created for company: {selectedCompany.name}
              </p>
            )}
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">Rs. </span>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount *
              </label>
              <div className="relative">
                <span className="absolute px-2 top-2.5 text-gray-500">Rs. </span>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.paidAmount}
                  onChange={handlePaidAmountChange}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Pending Amount Display */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Pending Amount:</span>
              <span className="text-lg font-semibold text-orange-600">Rs. {pendingAmount}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <div className="relative">
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 appearance-none bg-white"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type *
            </label>
            <div className="relative">
              <select
                required
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 appearance-none bg-white"
              >
                <option value="online">Online</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                "Add Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;