import Decimal from "decimal.js";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  remark?: string;
  companyName: string;
  companyId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  clientId: string;
  companyId: string;
  amount: Decimal;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
}

export interface Company {
  id: string;
  name: string;
}

