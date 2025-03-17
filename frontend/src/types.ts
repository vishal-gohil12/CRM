export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  remark?: string;
  companyName: string;
  companyId: string;
  reminder?: {
    datetime: string;
    message: string;
  };
  createdAt: string;
}

export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  companyId: string;
  companyName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: TransactionStatus;
  payment_type: string;
  createdAt: string;
}

export interface TransactionFormData {
  companyName: string;
  customerEmail: string;
  totalAmount: number;
  paidAmount: number;
  status?: TransactionStatus;
  payment_type?: string;
}

export interface Company {
  id: string;
  name: string;
}

