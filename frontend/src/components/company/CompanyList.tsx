import React, { useEffect, useState } from "react";
import { Client, Transaction } from "../../types";
import { BACKEND_URL } from "../../backendUrl";
import axios from "axios";
import toast from "react-hot-toast";
import AddCompany from "./AddCompany";
import { Building2, Users, CreditCard, ChevronDown, ChevronUp, Plus, Search, RefreshCw } from "lucide-react";

export interface Company {
  id: string;
  name: string;
  industry: string;
  customers: Client[];
  transactions: Transaction[];
}

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Company | "customerCount" | "transactionCount";
    direction: "ascending" | "descending";
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/company/all`, {
        headers: { authorization: localStorage.getItem("token") }
      });

      if (res.data.status) {
        setCompanies(res.data.companies);
      } else {
        toast.error("Error while fetching company data");
      }
    } catch (err) {
      console.error("Error while fetching company data:", err);
      toast.error("Failed to fetch company data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchCompanies();
    setIsRefreshing(false);
  };

  // Add company to state instantly
  const handleCompanyAdded = (newCompany: Company) => {
    setCompanies((prev) => [...prev, newCompany]);
    setShowModal(false); // Close modal after adding
    toast.success(`${newCompany.name} added successfully`);
  };

  // Sorting function
  const requestSort = (key: keyof Company | "customerCount" | "transactionCount") => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const getSortedCompanies = () => {
    let filteredCompanies = [...companies];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredCompanies = filteredCompanies.filter(
        company => 
          company.name.toLowerCase().includes(searchLower) || 
          company.industry.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      filteredCompanies.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === "customerCount") {
          aValue = a.customers.length;
          bValue = b.customers.length;
        } else if (sortConfig.key === "transactionCount") {
          aValue = a.transactions.length;
          bValue = b.transactions.length;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredCompanies;
  };

  const getSortIcon = (columnName: keyof Company | "customerCount" | "transactionCount") => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return null;
    }
    return sortConfig.direction === "ascending" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const getIndustryColor = (industry: string) => {
    const industryMap: Record<string, string> = {
      "Technology": "bg-gray-200 text-gray-800",
      "Healthcare": "bg-gray-300 text-gray-900",
      "Finance": "bg-gray-100 text-gray-800",
      "Retail": "bg-gray-200 text-gray-800",
      "Manufacturing": "bg-gray-300 text-gray-900",
      "Education": "bg-gray-100 text-gray-800",
      "Transportation": "bg-gray-200 text-gray-800",
      "Entertainment": "bg-gray-300 text-gray-900",
      "Food & Beverage": "bg-gray-100 text-gray-800"
    };
    
    return industryMap[industry] || "bg-gray-200 text-gray-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>
          
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`${isRefreshing ? "animate-spin" : ""}`} size={18} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Company
          </button>
        </div>
      </div>

      {showModal && <AddCompany onClose={() => setShowModal(false)} onCompanyAdded={handleCompanyAdded} />}

      {/* Loader State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600">Loading company data...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <Building2 size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No Companies Found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first company</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Company
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th 
                    className="p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Company Name
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th 
                    className="p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                    onClick={() => requestSort("industry")}
                  >
                    <div className="flex items-center gap-2">
                      Industry
                      {getSortIcon("industry")}
                    </div>
                  </th>
                  <th 
                    className="p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                    onClick={() => requestSort("customerCount")}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      Customers
                      {getSortIcon("customerCount")}
                    </div>
                  </th>
                  <th 
                    className="p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                    onClick={() => requestSort("transactionCount")}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} />
                      Transactions
                      {getSortIcon("transactionCount")}
                    </div>
                  </th>
                  <th className="p-4 font-semibold text-gray-700 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getSortedCompanies().map((company) => (
                  <React.Fragment key={company.id}>
                    {/* Main Company Row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{company.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIndustryColor(company.industry)}`}>
                          {company.industry}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{company.customers.length}</td>
                      <td className="p-4 text-gray-600">{company.transactions.length}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                          className={`
                            px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 mx-auto
                            ${expandedCompany === company.id 
                              ? "bg-gray-300 text-gray-800 hover:bg-gray-400" 
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"}
                            transition-colors
                          `}
                        >
                          {expandedCompany === company.id 
                            ? <>Hide Details <ChevronUp size={16} /></> 
                            : <>View Details <ChevronDown size={16} /></>}
                        </button>
                      </td>
                    </tr>
                    {expandedCompany === company.id && (
                      <tr>
                        <td colSpan={5} className="p-0 bg-gray-50">
                          <div className="p-6 border-t border-gray-100 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                  <Users className="text-gray-700" />
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    Customers ({company.customers.length})
                                  </h3>
                                </div>
                                
                                <div className="max-h-64 overflow-y-auto pr-2">
                                  {company.customers.length > 0 ? (
                                    <ul className="space-y-2">
                                      {company.customers.map((customer) => (
                                        <li key={customer.id} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                          <div className="font-medium">{customer.name}</div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                                      <Users size={32} className="text-gray-300 mb-2" />
                                      <p>No customers yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Transactions Section */}
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                  <CreditCard className="text-gray-700" />
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    Transactions ({company.transactions.length})
                                  </h3>
                                </div>
                                
                                <div className="max-h-64 overflow-y-auto pr-2">
                                  {company.transactions.length > 0 ? (
                                    <ul className="space-y-2">
                                      {company.transactions.map((tx) => (
                                        <li key={tx.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                          <div className="flex justify-between mb-1">
                                            <span className="font-medium text-gray-800">
                                              ${parseFloat(tx.amount.toString()).toFixed(2)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              {new Date(tx.date).toLocaleDateString(undefined, { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                              })}
                                            </span>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                                      <CreditCard size={32} className="text-gray-300 mb-2" />
                                      <p>No transactions yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}