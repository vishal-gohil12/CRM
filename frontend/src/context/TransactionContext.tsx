import { ReactNode, createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../backendUrl';
import { toast } from 'react-hot-toast';
import type { Transaction } from '../types';
import { useUser } from './authContext';

interface TransactionContextValue {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

export const TransactionProvider = ({ children }: {children: ReactNode}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useUser();

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/transactions/get_all`, {
        headers: {
          authorization: localStorage.getItem('token') || '',
        },
      });
      if (res.data.status) {
        setTransactions(res.data.transactions);
      } else {
        toast.error("Failed to fetch transactions.");
      }
    } catch (error) {
      toast.error("Error while fetching transactions");
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    if(user) {
      fetchTransactions();
      console.log('fetch')
    }
  }, [user]);

  const refreshTransactions = async () => {
    await fetchTransactions();
  };

  return (
    <TransactionContext.Provider value={{ transactions, setTransactions, refreshTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
