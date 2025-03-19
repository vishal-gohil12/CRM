import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  Filter,
  ArrowUpDown,
  Edit,
  IndianRupee,
  Check,
  Clock
} from "lucide-react";
import type { Transaction } from "../../context/TransactionContext";
import AddTransactionModal from "./AddTransactionModal";
import UpdateTransactionModal from "./UpdateTransactionModal"; // New component
import { useTransactions } from "../../context/TransactionContext";
import { BACKEND_URL } from "../../backendUrl";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const THEME = {
  primary: "bg-orange-500",
  primaryHover: "hover:bg-orange-600",
  secondary: "bg-black",
  secondaryHover: "hover:bg-gray-800",
  text: "text-black",
  textLight: "text-white",
  accent: "bg-orange-100",
  accentHover: "hover:bg-orange-200",
};

const TransactionStatusBadge = ({
  status,
}: {
  status: Transaction["status"];
}) => {
  const statusStyles = {
    completed: "bg-green-100 text-green-800 border-green-300",
    pending: "bg-orange-100 text-orange-800 border-orange-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Transactions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const { transactions, setTransactions } = useTransactions();

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      const total = filteredTransactions.reduce(
        (sum, transaction) =>
          transaction.status !== "cancelled"
            ? sum + Number(transaction.totalAmount)
            : sum,
        0
      );
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }

    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, statusFilter, searchTerm]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTransactions =
    transactions?.filter((transaction) => {
      const customerName = transaction.customerName?.toLowerCase() || "";
      const companyName = transaction.companyName?.toLowerCase() || "";
      const matchesSearch =
        customerName.includes(searchTerm.toLowerCase()) ||
        companyName.includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === "amount") {
      return sortDirection === "asc"
        ? Number(a.totalAmount) - Number(b.totalAmount)
        : Number(b.totalAmount) - Number(a.totalAmount);
    } else if (sortField === "createdAt") {
      return sortDirection === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const aValue =
        a[sortField as keyof Transaction]?.toString().toLowerCase() || "";
      const bValue =
        b[sortField as keyof Transaction]?.toString().toLowerCase() || "";
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
  });

  const handleDeleteTransaction = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/transactions/${id}`,
        {
          headers: {
            authorization: localStorage.getItem("token"),
          },
        }
      );
      if (response.data.status) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsUpdateModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
        <p className="text-lg font-medium text-gray-800">
          Loading transactions...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-black">
            Transactions
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your financial transactions
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`flex items-center justify-center px-4 py-2.5 ${THEME.primary} ${THEME.primaryHover} ${THEME.textLight} rounded-lg transition-all duration-300 shadow-md w-full sm:w-auto`}
        >
          <Plus size={18} className="mr-2" />
          New Transaction
        </button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm font-medium">
                Total Amount
              </p>
              <h3 className="text-2xl font-bold mt-1">
                Rs. {totalAmount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <IndianRupee size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-orange-100">
            {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="bg-gradient-to-r from-black to-gray-800 rounded-xl p-4 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-300 text-sm font-medium">Completed</p>
              <h3 className="text-2xl font-bold mt-1">
                {
                  filteredTransactions.filter((t) => t.status === "completed")
                    .length
                }
              </h3>
            </div>
            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
              <Check size={24} className="text-green-400" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-gray-300">
            {filteredTransactions.length > 0
              ? (
                  (filteredTransactions.filter((t) => t.status === "completed")
                    .length /
                    filteredTransactions.length) *
                  100
                ).toFixed(1)
              : "0.0"}
            % of total
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 text-gray-800 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <h3 className="text-2xl font-bold mt-1">
                {
                  filteredTransactions.filter((t) => t.status === "pending")
                    .length
                }
              </h3>
            </div>
            <div className="p-2 bg-orange-500 bg-opacity-20 rounded-lg">
              <Clock size={24} className="text-orange-500" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-gray-500">
            {filteredTransactions.length > 0
              ? (
                  (filteredTransactions.filter((t) => t.status === "pending")
                    .length /
                    filteredTransactions.length) *
                  100
                ).toFixed(1)
              : "0.0"}
            % of total
          </div>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by customer or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} className="mr-2 text-gray-500" />
            Filters
          </button>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setSortField("createdAt");
              setSortDirection("desc");
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
                  statusFilter === "all"
                    ? `${THEME.primary} ${THEME.textLight} shadow-md`
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
                  statusFilter === "completed"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-green-600 border border-green-600 hover:bg-green-50"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
                  statusFilter === "pending"
                    ? `${THEME.primary} ${THEME.textLight} shadow-md`
                    : "bg-white text-orange-500 border border-orange-500 hover:bg-orange-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("cancelled")}
                className={`px-5 py-2 rounded-full transition-all duration-300 focus:outline-none ${
                  statusFilter === "cancelled"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white text-red-600 border border-red-600 hover:bg-red-50"
                }`}
              >
                Cancelled
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("companyName")}
                >
                  <div className="flex items-center">
                    Company
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("customerName")}
                >
                  <div className="flex items-center">
                    Customer
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("totalAmount")}
                >
                  <div className="flex items-center">
                    Total Amount
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("paidAmount")}
                >
                  <div className="flex items-center">
                    Paid Amount
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                  <div className="flex items-center">Pending Amount</div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("payment_type")}
                >
                  <div className="flex items-center">
                    Payment Method
                    <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    className="hover:bg-orange-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">
                        {transaction.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">
                        {transaction.customerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TransactionStatusBadge status={transaction.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-semibold ${
                          transaction.status === "completed"
                            ? "text-green-600"
                            : transaction.status === "cancelled"
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}
                      >
                        Rs. {Number(transaction.totalAmount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium text-green-600">
                        Rs. {Number(transaction.paidAmount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium text-orange-600">
                        Rs.{" "}
                        {Number(
                          transaction.totalAmount - transaction.paidAmount
                        ).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium capitalize">
                        {transaction.payment_type?.replace("_", " ") || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                          title="Update transaction"
                          onClick={() => handleUpdateTransaction(transaction)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="flex items-center text-red-600 hover:text-red-800 transition-colors"
                          disabled={loadingId === transaction.id}
                          title="Delete transaction"
                        >
                          {loadingId === transaction.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-gray-100 rounded-full mb-4">
                        <Search size={24} className="text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">
                        No transactions found
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      {currentTransaction && (
        <UpdateTransactionModal
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setCurrentTransaction(null);
          }}
          transaction={currentTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;