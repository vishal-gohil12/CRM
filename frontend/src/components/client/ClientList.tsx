import React, { useState, useEffect } from 'react';
import { Customer, useCustomers } from "../../context/clientContext";
import { FiUser, FiMail, FiPhone, FiSearch, FiChevronDown, FiChevronUp, FiPlus, FiBell, FiEdit, FiTrash2, FiPaperclip, FiFolder } from 'react-icons/fi';
import { AddCustomerModal } from './AddClientModal';
import ReminderModal from './ReminderModal';
import { UpdateCustomerModal } from './UpdateCustomerModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { DocumentUploadModal } from './Docs/DocumentUploadModal';
import DocumentViewer from './Docs/DocumentViewer';

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  isExpanded: boolean;
  onReminderClick: () => void;
  onRefresh: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onClick, 
  isExpanded, 
  onReminderClick,
  onRefresh
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState<boolean>(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState<boolean>(false);
  
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
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <FiUser size={16} />
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900">{customer.company_and_name || 'Unnamed'}</h3>
            <p className="text-xs text-gray-500">{customer.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="bg-black text-white text-xs px-2 py-0.5 rounded mr-3">
            GST: {customer.gst_no || 0}
          </span>
          {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <FiMail className="text-orange-400 mr-2" size={14} />
              <span className="text-xs text-gray-700">Email: {customer.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center">
              <FiPhone className="text-orange-400 mr-2" size={14} />
              <span className="text-xs text-gray-700">Phone: {customer.phone || 'Not provided'}</span>
            </div>
          </div>
          
          {customer.remark && (
            <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-100">
              <p className="text-xs text-gray-700">{customer.remark}</p>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
            <div className="flex gap-2 mb-2 sm:mb-0">
              <button 
                className="px-2 py-1 bg-white text-black border border-gray-300 rounded hover:bg-orange-50 transition-colors flex items-center gap-1 text-xs shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUpdateModalOpen(true);
                }}
              >
                <FiEdit size={12} />
                <span>Update</span>
              </button>
              
              <button 
                className="px-2 py-1 bg-white text-black border border-gray-300 rounded hover:bg-orange-50 transition-colors flex items-center gap-1 text-xs shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                }}
              >
                <FiTrash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                className="px-2 py-1 bg-orange-400 text-white rounded hover:bg-orange-500 transition-colors flex items-center gap-1 text-xs shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDocUploadModalOpen(true);
                }}
              >
                <FiPaperclip size={12} />
                <span>Upload</span>
              </button>
              
              <button 
                className="px-2 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-1 text-xs shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDocViewerOpen(true);
                }}
              >
                <FiFolder size={12} />
                <span>Docs</span>
              </button>
              
              <button 
                className="px-2 py-1 bg-orange-400 text-white rounded hover:bg-orange-500 transition-colors flex items-center gap-1 text-xs shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReminderClick();
                }}
              >
                <FiBell size={12} />
                <span>Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <UpdateCustomerModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        customer={customer}
        onCustomerUpdated={onRefresh}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        customerId={customer.id}
        customerName={customer.company_and_name}
        onConfirmDelete={onRefresh}
      />

      <DocumentUploadModal 
        isOpen={isDocUploadModalOpen}
        onClose={() => setIsDocUploadModalOpen(false)}
        customerId={customer.id}
        onDocumentUploaded={onRefresh}
      />

      <DocumentViewer
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        customerId={customer.id}
      />
    </div>
  );
};

const CustomerList: React.FC = () => {
  const { customers, loading, refreshCustomers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('company_and_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    refreshCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? undefined : customerId);
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

  const handleReminderClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsReminderModalOpen(true);
  };

  const handleReminderAdded = () => {
    console.log('Reminder added');
    setIsReminderModalOpen(false);
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
          <div className="w-10 h-10 rounded-full bg-orange-200"></div>
          <div className="mt-3 text-orange-500 text-sm">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Customers</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 bg-orange-400 text-white rounded hover:bg-orange-500 flex items-center gap-1 transition-colors text-sm shadow-sm"
        >
          <FiPlus size={14} />
          <span>Add Customer</span>
        </button>
      </div>
      
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-gray-400" size={14} />
        </div>
        <input
          type="text"
          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-orange-400 text-sm"
          placeholder="Search customers by name, email or phone..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      <div className="overflow-hidden">
        <div className="mb-3 bg-gray-100 p-2 rounded flex items-center text-xs font-medium text-gray-700">
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
          <div className="w-6"></div>
        </div>
        
        {sortedAndFilteredCustomers.length > 0 ? (
          <div>
            {sortedAndFilteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={() => toggleExpand(customer.id)}
                isExpanded={expandedCustomerId === customer.id}
                onReminderClick={() => handleReminderClick(customer.id)}
                onRefresh={refreshCustomers}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <FiUser size={20} className="text-gray-400" />
            </div>
            <p className="mt-3 text-gray-500 text-sm">No customers found</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-3 py-1.5 bg-orange-400 text-white rounded hover:bg-orange-500 inline-flex items-center gap-1 text-sm shadow-sm"
            >
              <FiPlus size={14} />
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

      <ReminderModal 
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        customerId={selectedCustomerId}
        onReminderAdded={handleReminderAdded}
      />
    </div>
  );
};

export default CustomerList;