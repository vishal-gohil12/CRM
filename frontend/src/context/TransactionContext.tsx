import { ReactNode, createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../backendUrl';
import { toast } from 'react-hot-toast';
import { useUser } from './authContext';
import { useCompany } from './companyContext';

// Updated backend response interfaces
interface Customer {
  id: string;
  companyId: string;
  company_and_name: string;
  email: string;
  gst_no: number;
  phone: string | null;
  remark: string;
  documents: string[];
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
}

// Backend transaction response
interface TransactionResponse {
  id: string;
  companyId: string;
  customerId: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_type: string;
  createdAt: string;
  customer: Customer;
  company: Company;
}

// Frontend Transaction model
export interface Transaction {
  id: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_type: string;
  createdAt: string;
}

// Transaction input for creating/updating
export type TransactionInput = {
  companyName: string;
  customerEmail: string;
  totalAmount: number;
  paidAmount: number;
  status?: 'pending' | 'completed' | 'cancelled';
  payment_type?: string;
};

// Context value interface
interface TransactionContextValue {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  refreshTransactions: () => Promise<void>;
  addTransaction: (data: TransactionInput) => Promise<boolean>;
  updateTransaction: (id: string, data: Partial<TransactionInput>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);


const mapTransactionResponse = (data: TransactionResponse): Transaction => {
  return {
    id: data.id,
    companyName: data.company?.name || '',
    customerName: data.customer?.company_and_name || '',
    customerEmail: data.customer?.email || '',
    totalAmount: parseFloat(data.totalAmount),
    paidAmount: parseFloat(data.paidAmount),
    pendingAmount: parseFloat(data.pendingAmount),
    status: data.status,
    payment_type: data.payment_type,
    createdAt: data.createdAt,
  };
};

export const TransactionProvider = ({ children }: {children: ReactNode}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  
  const fetchTransactions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    if (!selectedCompany) {
      setTransactions([]); // Or handle as needed
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/api/transactions/get_all`, {
        params: { companyName: selectedCompany.name.toLowerCase() },
        headers: { authorization: localStorage.getItem("token") }
      });
      
      if (res.data.status) {
        // Map backend response to frontend model
        const formattedTransactions = res.data.transactions.map(
          (item: TransactionResponse) => mapTransactionResponse(item)
        );
        
        setTransactions(formattedTransactions);
      } else {
        setError(res.data.message || "Failed to fetch transactions");
        toast.error("Failed to fetch transactions");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      toast.error("Error while fetching transactions");
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const refreshTransactions = async () => {
    await fetchTransactions();
  };
  
  // Add transaction function with optimistic updates
  const addTransaction = async (transactionData: TransactionInput): Promise<boolean> => {
    try {
      // Optimistic update - add temporary transaction to UI
      const tempId = `temp-${Date.now()}`;
      const tempTransaction: Transaction = {
        id: tempId,
        companyName: transactionData.companyName,
        customerName: 'Loading...',
        customerEmail: transactionData.customerEmail,
        totalAmount: transactionData.totalAmount,
        paidAmount: transactionData.paidAmount,
        pendingAmount: transactionData.totalAmount - transactionData.paidAmount,
        status: transactionData.status || 'pending',
        payment_type: transactionData.payment_type || 'cash',
        createdAt: new Date().toISOString()
      };
      
      setTransactions(prev => [tempTransaction, ...prev]);
      
      // Make API call
      const res = await axios.post(`${BACKEND_URL}/api/transactions`, transactionData, {
        headers: {
          authorization: localStorage.getItem('token') || '',
        },
      });
      
      if (res.data.status) {
        // Replace temp transaction with real one from backend
        const newTransaction = mapTransactionResponse(res.data.transaction);
        
        setTransactions(prev => 
          prev.map(t => t.id === tempId ? newTransaction : t)
        );
        toast.success("Transaction added successfully");
        return true;
      } else {
        // Revert optimistic update
        setTransactions(prev => prev.filter(t => t.id !== tempId));
        toast.error(res.data.message || "Failed to add transaction");
        return false;
      }
    } catch (error) {
      setTransactions(prev => prev.filter(t => t.id.startsWith('temp-')));
      toast.error("Error adding transaction");
      console.error("Error adding transaction:", error);
      return false;
    }
  };
  
  // Update transaction function
  const updateTransaction = async (id: string, transactionData: Partial<TransactionInput>): Promise<boolean> => {
    try {
      // Find the current transaction
      const currentTransaction = transactions.find(t => t.id === id);
      if (!currentTransaction) {
        toast.error("Transaction not found");
        return false;
      }
      
      // Store original transaction for rollback if needed
      const originalTransaction = { ...currentTransaction };
      
      // Calculate new values while keeping existing ones if not provided
      const updatedData = {
        companyName: transactionData.companyName || currentTransaction.companyName,
        customerEmail: transactionData.customerEmail || currentTransaction.customerEmail,
        totalAmount: transactionData.totalAmount ?? currentTransaction.totalAmount,
        paidAmount: transactionData.paidAmount ?? currentTransaction.paidAmount,
        status: transactionData.status || currentTransaction.status,
        payment_type: transactionData.payment_type || currentTransaction.payment_type
      };
      
      // Calculate pending amount based on total and paid
      const pendingAmount = updatedData.totalAmount - updatedData.paidAmount;
      
      // Optimistic update in state
      setTransactions(prev => prev.map(t => 
        t.id === id ? { 
          ...t, 
          ...updatedData, 
          pendingAmount,
        } : t
      ));
      
      // Make API call
      const res = await axios.put(`${BACKEND_URL}/api/transactions`, {
        ...updatedData
      }, {
        headers: {
          authorization: localStorage.getItem('token') || '',
        },
      });
      
      if (res.data.status) {
        const serverTransaction = mapTransactionResponse(res.data.transaction);
        setTransactions(prev => 
          prev.map(t => t.id === id ? serverTransaction : t)
        );
        toast.success("Transaction updated successfully");
        return true;
      } else {
        // Rollback on error
        setTransactions(prev => prev.map(t => t.id === id ? originalTransaction : t));
        toast.error(res.data.message || "Failed to update transaction");
        return false;
      }
    } catch (error) {
      // Rollback on exception
      const currentTransaction = transactions.find(t => t.id === id);
      if (currentTransaction) {
        setTransactions(prev => [...prev]); // Force re-render with original data
      }
      toast.error("Error updating transaction");
      console.error("Error updating transaction:", error);
      return false;
    }
  };
  
  // Delete transaction function
  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      // Store the transaction for rollback if needed
      const deletedTransaction = transactions.find(t => t.id === id);
      if (!deletedTransaction) {
        toast.error("Transaction not found");
        return false;
      }
      
      // Optimistic update - remove from UI immediately
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      // Make API call
      const res = await axios.delete(`${BACKEND_URL}/api/transactions/${id}`, {
        headers: {
          authorization: localStorage.getItem('token') || '',
        },
      });
      
      if (res.data.status) {
        toast.success("Transaction deleted successfully");
        return true;
      } else {
        // Rollback on error
        setTransactions(prev => [...prev, deletedTransaction].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        toast.error(res.data.message || "Failed to delete transaction");
        return false;
      }
    } catch (error) {
      // Rollback on exception
      const deletedTransaction = transactions.find(t => t.id === id);
      if (deletedTransaction) {
        setTransactions(prev => [...prev, deletedTransaction].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      toast.error("Error deleting transaction");
      console.error("Error deleting transaction:", error);
      return false;
    }
  };
  
  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      setTransactions, 
      refreshTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      isLoading,
      error
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use the transaction context
// eslint-disable-next-line react-refresh/only-export-components
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};