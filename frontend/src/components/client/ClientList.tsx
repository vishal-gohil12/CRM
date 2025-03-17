import React, { useState, useEffect } from 'react';
import { Customer, useCustomers } from "../../context/clientContext";
import { FiUser, FiMail, FiPhone, FiFileText, FiCalendar, FiSearch, FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import { AddCustomerModal } from './AddClientModal';

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  isExpanded: boolean;
}



const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onClick, isExpanded }) => {  
  const documents = customer.documents || [];
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden transition-all duration-300"
      style={{ borderLeft: '4px solid #FF8C00' }}
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <FiUser size={20} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{customer.company_and_name || 'Unnamed'}</h3>
            <p className="text-sm text-gray-500">{customer.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="bg-black text-white text-xs px-2 py-1 rounded mr-4">
            GST: {customer.gst_no || 0}
          </span>
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <FiMail className="text-orange-500 mr-2" />
              <span className="text-sm text-gray-700">Email: {customer.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center">
              <FiPhone className="text-orange-500 mr-2" />
              <span className="text-sm text-gray-700">Phone: {customer.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center">
              <FiFileText className="text-orange-500 mr-2" />
              <span className="text-sm text-gray-700">Documents: {documents.length}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="text-orange-500 mr-2" />
              <span className="text-sm text-gray-700">
                Created: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
          
          {customer.remark && (
            <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-100">
              <p className="text-sm text-gray-700">{customer.remark}</p>
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <button className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors">
              Details
            </button>
            <button className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
              Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



const CustomerList: React.FC = () => {
  const { customers, loading, refreshCustomers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('company_and_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    refreshCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleCustomerAdded = () => {
    refreshCustomers();
  };

  const sortedAndFilteredCustomers = (customers || [])
    .filter(customer => {
      if (!customer) return false;
      
      const nameMatch = customer.company_and_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const emailMatch = customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const phoneMatch = customer.phone?.includes(searchTerm) || false;
      
      return nameMatch || emailMatch || phoneMatch;
    })
    .sort((a, b) => {
      // Handle potential undefined values
      const fieldA = a[sortBy as keyof Customer] || '';
      const fieldB = b[sortBy as keyof Customer] || '';
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-orange-200"></div>
          <div className="mt-4 text-orange-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 transition-colors"
        >
          <FiPlus size={18} />
          <span>Add Customer</span>
        </button>
      </div>
      
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-gray-400" size={18} />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
          placeholder="Search customers by name, email or phone..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      <div className="overflow-hidden">
        <div className="mb-4 bg-gray-100 p-3 rounded-lg flex items-center text-sm font-medium text-gray-700">
          <div 
            className="flex-1 flex items-center cursor-pointer"
            onClick={() => handleSort('company_and_name')}
          >
            <span>Name</span>
            {sortBy === 'company_and_name' && (
              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="flex-1 flex items-center cursor-pointer"
            onClick={() => handleSort('email')}
          >
            <span>Email</span>
            {sortBy === 'email' && (
              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="flex-1 hidden md:flex items-center">
            <span>GST</span>
          </div>
          <div className="w-8"></div>
        </div>
        
        {sortedAndFilteredCustomers.length > 0 ? (
          <div>
            {sortedAndFilteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={() => toggleExpand(customer.id)}
                isExpanded={expandedCustomerId === customer.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <FiUser size={24} className="text-gray-400" />
            </div>
            <p className="mt-4 text-gray-500">No customers found</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 inline-flex items-center gap-2"
            >
              <FiPlus size={16} />
              <span>Add your first customer</span>
            </button>
          </div>
        )}
      </div>
      
      <AddCustomerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />
    </div>
  );
};

export default CustomerList;