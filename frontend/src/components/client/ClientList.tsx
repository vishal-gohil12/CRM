import React, { useEffect, useState } from "react";
import { Plus, Search, CircleEllipsisIcon } from "lucide-react";
import axios from "axios";
import AddClientModal from "./AddClientModal";
import UpdateClientModal from "./UpdateClientModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { BACKEND_URL } from "../../backendUrl";
import type { Client } from "../../types";
import { useClients } from "../../context/clientContext";
import { useUser } from "../../context/authContext";

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  remark?: string;
  clientName: string;
}

interface ClientRowProps {
  client: Client;
  onUpdate: (client: Client) => void;
  onDelete: (client: Client) => void;
  onShowRemark: (client: Client) => void;
}

const ClientRow: React.FC<ClientRowProps> = ({
  client,
  onUpdate,
  onDelete,
  onShowRemark,
}) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3 px-4">
        <div>
          <div className="font-medium text-sm">{client.name}</div>
          <div className="text-xs text-gray-500 md:hidden">
            {client.companyName}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell text-sm">
        {client.companyName}
      </td>
      <td className="py-3 px-4 text-sm">{client.email}</td>
      <td className="py-3 px-4 text-sm">{client.phone}</td>
      <td className="py-3 px-4 text-sm">
        {client.remark
          ? client.remark.slice(0, 12) +
            (client.remark.length > 12 ? "..." : "")
          : " N/A"}
      </td>

      <td className="py-3 px-4 text-sm cursor-pointer relative">
        <CircleEllipsisIcon onClick={() => setMenuOpen((prev) => !prev)} />
        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full right-0 mt-1 bg-white border border-gray-200 shadow-md rounded-md z-10"
          >
            <button
              onClick={() => {
                onUpdate(client);
                setMenuOpen(false);
              }}
              className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              Update
            </button>
            <button
              onClick={() => {
                onDelete(client);
                setMenuOpen(false);
              }}
              className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              Delete
            </button>
            <button
              onClick={() => {
                onShowRemark(client);
                setMenuOpen(false);
              }}
              className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              Remark
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const ClientList: React.FC = () => {
  const { clients, setClients } = useClients();
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [remarkClient, setRemarkClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useUser();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [clients]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = (client: Client) => {
    setEditingClient(client);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
  };

  const handleShowRemark = (client: Client) => {
    setRemarkClient(client);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/customer/delete`, {
        data: { id: clientToDelete.id },
        headers: { authorization: localStorage.getItem("token") },
      });
      setClients((prevClients) =>
        prevClients.filter((c) => c.id !== clientToDelete.id)
      );
      setClientToDelete(null);
    } catch (err) {
      alert("Failed to delete client");
      console.error("Failed to delete client:", err);
    }
  };

  console.log(user);

  if(isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <p className="text-lg font-semibold">Loading clients...</p>
    </div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">Clients</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Add Client
        </button>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0 h-lvh">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold hidden md:table-cell">
                  Company
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Phone
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Remark
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onShowRemark={handleShowRemark}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={(newClient: Client) =>
          setClients((prevClients) => [...prevClients, newClient])
        }
      />

      {editingClient && (
        <UpdateClientModal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          client={editingClient}
          onClientUpdated={(updatedClient: Client) =>
            setClients((prevClients) =>
              prevClients.map((c) =>
                c.id === updatedClient.id ? updatedClient : c
              )
            )
          }
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDelete}
        clientName={clientToDelete ? clientToDelete.name : ""}
      />

      <RemarkModal
        isOpen={!!remarkClient}
        onClose={() => setRemarkClient(null)}
        remark={remarkClient ? remarkClient.remark : ""}
        clientName={remarkClient ? remarkClient.name : ""}
      />
    </div>
  );
};

const RemarkModal: React.FC<RemarkModalProps> = ({
  isOpen,
  onClose,
  remark,
  clientName,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md shadow-md max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4">Remark for {clientName}</h2>
        <p className="mb-4">{remark || "No remark available"}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ClientList;
