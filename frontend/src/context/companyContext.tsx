import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the Company interface
export interface Company {
  id: number;
  name: string;
}

// Define the context type
interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  addCompany: (company: Company) => void;
  getCompanyById: (id: number) => Company | undefined;
  getCompanyByName: (name: string) => Company | undefined;
}

// Create the context with default values
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// Sample initial companies data
const initialCompanies: Company[] = [
  { id: 1, name: 'Sunfiber' },
  { id: 2, name: 'Jyoti trading' },
  { id: 3, name: 'GlobalTrade' },
  { id: 4, name: 'InnovateX' },
  { id: 5, name: 'EcoSolutions' },
  { id: 6, name: 'MegaIndustries' },
];

// Create provider component
export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Add a new company
  const addCompany = (company: Company) => {
    setCompanies((prevCompanies) => [...prevCompanies, company]);
  };
  // Get company by ID
  const getCompanyById = (id: number) => {
    return companies.find((company) => company.id === id);
  };

  // Get company by name (case insensitive)
  const getCompanyByName = (name: string) => {
    return companies.find(
      (company) => company.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Context value
  const value = {
    companies,
    selectedCompany,
    setSelectedCompany,
    addCompany,
    getCompanyById,
    getCompanyByName,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

// Custom hook for using the company context
// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};