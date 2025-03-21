import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BACKEND_URL } from "../backendUrl";
import { useUser } from "./authContext";
import { useCompany } from "./companyContext";

export interface Customer {
  id: string;
  companyId: string;
  company_and_name: string;
  email: string;
  gst_no: number;
  phone?: string;
  remark?: string;
  documents: string[];
  createdAt: string;
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  refreshCustomers: () => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByCompany: (companyId: string) => Customer[];
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState<boolean>(false);
  const fetchCustomers = async () => {
    setLoading(true);

    if (!selectedCompany) {
      setCustomers([]);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/customer/get_all`, {
        params: { companyName: selectedCompany.name.toLowerCase() },
        headers: { authorization: localStorage.getItem("token") }
      });

      if (!response.data.status) {
        throw new Error(response.data.message || "Failed to fetch customers");
      }
      
      setCustomers(response.data.customers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(`Error: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    } else {
      setCustomers([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomersByCompany = (companyId: string): Customer[] => {
    return customers.filter(customer => customer.companyId === companyId);
  };

  return (
    <CustomerContext.Provider 
      value={{ 
        customers, 
        loading, 
        setCustomers, 
        refreshCustomers,
        getCustomerById,
        getCustomersByCompany
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomers must be used within a CustomerProvider");
  }
  return context;
};