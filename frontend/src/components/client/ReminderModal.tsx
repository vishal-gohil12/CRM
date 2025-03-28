import React, { useState, useEffect } from 'react';
import { useCustomers, Customer } from "../../context/clientContext";
import { useTransactions, Transaction } from "../../context/TransactionContext";
import { FiClock, FiCalendar, FiMessageSquare, FiX, FiSend, FiChevronDown, FiUser, FiUsers, FiType } from 'react-icons/fi';
import axios from 'axios';
import { BACKEND_URL } from '../../backendUrl';
import toast from 'react-hot-toast';



interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  transactionId?: string;
  onReminderAdded?: () => void;
}


const ReminderModal: React.FC<ReminderModalProps> = ({ 
  isOpen, 
  onClose, 
  customerId, 
  transactionId,
  onReminderAdded 
}) => {
  const [message, setMessage] = useState<string>('');
  const [subject, setSubject] = useState<string>("");
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [showTransactionDropdown, setShowTransactionDropdown] = useState<boolean>(false);
  const { customers } = useCustomers();
  const { transactions } = useTransactions();
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [reminderRecipient, setReminderRecipient] = useState<'company' | 'admin'>('company');

  // Pre-fill customer if provided
  useEffect(() => {
    if (customerId && customers) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        filterCustomerTransactions(customerId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, customers, transactions]);

  useEffect(() => {
    if (transactionId && customerTransactions.length > 0) {
      const transaction = customerTransactions.find(t => t.id === transactionId);
      if (transaction) {
        setSelectedTransaction(transaction);
      }
    }
  }, [transactionId, customerTransactions]);

  const filterCustomerTransactions = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer && customer.email) {
      const filteredTransactions = transactions.filter(t => 
        t.customerEmail === customer.email
      );
      setCustomerTransactions(filteredTransactions);
    } else {
      setCustomerTransactions([]);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedTransaction(null);
    setShowCustomerDropdown(false);
    filterCustomerTransactions(customer.id);
  };

  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    
    if (!message) {
      toast.error('Please enter a message');
      return;
    }
    if (!subject) {
      toast.error('Please enter a subject');
      return;
    }
    
    if (!date || !time) {
      toast.error('Please select date and time');
      return;
    }
    
    const dateTime = new Date(`${date}T${time}`);
    
    if (dateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }
    
    setLoading(true);
    
    try {
      const reminderData = {
        customerId: selectedCustomer.id,
        transactionId: selectedTransaction?.id || null,
        datetime: dateTime.toISOString(),
        subject,
        message,
        recipient: reminderRecipient // Add recipient to the payload
      };
      
      const response = await axios.post(`${BACKEND_URL}/api/reminders`, reminderData);
      
      if (response.data.status) {
        toast.success('Reminder created successfully');
        if (onReminderAdded) onReminderAdded();
        onClose();
        resetForm();
      } else {
        toast.error(response.data.error || 'Failed to create reminder');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      toast.error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setMessage('');
    setDate('');
    setTime('');
    setSelectedCustomer(null);
    setSelectedTransaction(null);
    setReminderRecipient('company');
  };
  
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden transform transition-all animate-fadeIn">
        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h2 className="text-white text-lg font-semibold flex items-center">
            <FiClock className="mr-2" />
            Create Reminder
          </h2>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-orange-600 rounded-full p-1 transition-colors absolute top-4 right-4"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <form 
          onSubmit={handleSubmit} 
          className="flex-grow overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar"
        >
          {/* Customer Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <div className="relative">
              <div 
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-orange-500 transition-colors"
              >
                {selectedCustomer ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mr-2">
                      <FiMessageSquare size={14} />
                    </div>
                    <span>{selectedCustomer.company_and_name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Select customer</span>
                )}
                <FiChevronDown />
              </div>
              
              {showCustomerDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {customers && customers.length > 0 ? (
                      customers.map(customer => (
                        <div 
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="p-2 hover:bg-orange-50 rounded-md cursor-pointer flex items-center"
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mr-2">
                            <FiMessageSquare size={14} />
                          </div>
                          <span>{customer.company_and_name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500 text-center">No customers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rest of the form remains the same... */}
          
          {/* Transaction Dropdown */}
          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction (Optional)
              </label>
              <div className="relative">
                <div 
                  onClick={() => setShowTransactionDropdown(!showTransactionDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-orange-500 transition-colors"
                >
                  {selectedTransaction ? (
                    <span>{selectedTransaction.companyName} - Rs. {selectedTransaction.pendingAmount}</span>
                  ) : (
                    <span className="text-gray-400">Select transaction (optional)</span>
                  )}
                  <FiChevronDown />
                </div>
                
                {showTransactionDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {customerTransactions && customerTransactions.length > 0 ? (
                        customerTransactions.map(transaction => (
                          <div 
                            key={transaction.id}
                            onClick={() => handleTransactionSelect(transaction)}
                            className="p-2 hover:bg-orange-50 rounded-md cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <span>{transaction.companyName}</span>
                              <span className="font-medium"><span className='text-sm text-gray-500'>Pending: </span>Rs. {transaction.pendingAmount}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-center">No transactions found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subject Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 items-center">
              <FiType className="mr-2 text-orange-500 inline" /> Email Subject
            </label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiMessageSquare />
              </span>
            </div>
          </div>

          {/* Reminder Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Recipient
            </label>
            <div className="flex gap-3">
              <div
                onClick={() => setReminderRecipient('company')}
                className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all flex flex-col items-center ${
                  reminderRecipient === 'company' 
                    ? 'border-orange-500 bg-orange-50 shadow-sm' 
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <FiUsers size={24} className={`${reminderRecipient === 'company' ? 'text-orange-500' : 'text-gray-500'} mb-2`} />
                <span className={`text-sm font-medium ${reminderRecipient === 'company' ? 'text-orange-700' : 'text-gray-600'}`}>
                  Send to Company
                </span>
                <span className="text-xs text-gray-500 mt-1 text-center">
                  Notify the customer
                </span>
              </div>
              
              <div
                onClick={() => setReminderRecipient('admin')}
                className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all flex flex-col items-center ${
                  reminderRecipient === 'admin' 
                    ? 'border-orange-500 bg-orange-50 shadow-sm' 
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <FiUser size={24} className={`${reminderRecipient === 'admin' ? 'text-orange-500' : 'text-gray-500'} mb-2`} />
                <span className={`text-sm font-medium ${reminderRecipient === 'admin' ? 'text-orange-700' : 'text-gray-600'}`}>
                  Send to Myself
                </span>
                <span className="text-xs text-gray-500 mt-1 text-center">
                  Reminder for admin only
                </span>
              </div>
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Enter your reminder message..."
              rows={4}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiClock className="inline mr-1" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>
          
          {/* Action Buttons - Sticky at Bottom */}
          <div className="bottom-0 bg-white  pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 flex justify-end space-x-3 shadow-top">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-2"></div>
              ) : (
                <>
                  <FiSend className="mr-2" /> 
                  {reminderRecipient === 'company' ? 'Send to Company' : 'Create Self-Reminder'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;