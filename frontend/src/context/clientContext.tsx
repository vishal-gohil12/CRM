// ClientProvider.tsx
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Client } from "../types";
import { BACKEND_URL } from "../backendUrl";
import axios from "axios";
import toast from "react-hot-toast";
import { useUser } from "./authContext";

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/customer/get_all`, {
        headers: { authorization: localStorage.getItem("token") },
      });
      if (!response.data.status) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setClients(response.data.customers);
    } catch (err) {
      toast.error(`Error : ${err}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const refreshClients = async () => {
    await fetchClients();
  };

  return (
    <ClientContext.Provider value={{ clients, loading, setClients, refreshClients }}>
      {children}
    </ClientContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
};
