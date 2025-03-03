import { useState } from "react";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import type { Transaction } from "../../types";
import AddTransactionModal from "./AddTransactionModal";
import UpdateTransactionModal from "./UpdateTransactionModal";
import { useTransactions } from "../../context/TransactionContext";
import { BACKEND_URL } from "../../backendUrl";
import axios from "axios";

const Transactions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { transactions, setTransactions } = useTransactions();

  const filteredTransactions = transactions?.filter((transaction) => {
    const customerName = transaction.customerName.toLowerCase() || "";
    const companyName = transaction.companyName.toLowerCase() || "";
    const matchesSearch =
      customerName.includes(searchTerm.toLowerCase()) ||
      companyName.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  })|| [];

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleUpdateClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsUpdateModalOpen(true);
  };

  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions((prev) => 
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/transactions/${id}`, {
        method: "DELETE",
        headers: {
          authorization: localStorage.getItem('token')
        }
      });
      if (response.data.status) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  if(!transactions) {
    return <div className="flex justify-center items-center h-screen">
      <p className="text-lg font-semibold">Loading transactions...</p>
    </div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">Transactions</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          New Transaction
        </button>
      </div>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
            statusFilter === "all"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
            statusFilter === "completed"
              ? "bg-green-600 text-white shadow-lg"
              : "bg-white text-green-600 border border-green-600 hover:bg-green-50"
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
            statusFilter === "pending"
              ? "bg-yellow-500 text-white shadow-lg"
              : "bg-white text-yellow-500 border border-yellow-500 hover:bg-yellow-50"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("cancelled")}
          className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
            statusFilter === "cancelled"
              ? "bg-red-600 text-white shadow-lg"
              : "bg-white text-red-600 border border-red-600 hover:bg-red-50"
          }`}
        >
          Cancelled
        </button>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search by customer or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Company
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {transaction.companyName}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {transaction.customerName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={
                        transaction.status === "completed"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      Rs. {Number(transaction.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => handleUpdateClick(transaction)}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Edit size={16} />
                      Update
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm">
                <button onClick={() => handleDeleteTransaction(transaction.id)} className="flex items-center gap-2 text-red-600 hover:underline">
                {loadingId === transaction.id ? (
                  <Loader2 className="animate-spin" size={16} /> 
                ) : (
                  <Trash2 size={16} />
                )} Delete
                </button>
              </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {isUpdateModalOpen && selectedTransaction && (
        <UpdateTransactionModal
          isOpen={isUpdateModalOpen}
          transaction={selectedTransaction}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateTransaction={handleTransactionUpdate}
        />
      )}
    </div>
  );
};

export default Transactions;
