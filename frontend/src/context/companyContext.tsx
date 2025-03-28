import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Company {
  id: number;
  name: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  addCompany: (company: Company) => void;
  getCompanyById: (id: number) => Company | undefined;
  getCompanyByName: (name: string) => Company | undefined;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const initialCompanies: Company[] = [
  { id: 1, name: "Sunfiber" },
  { id: 2, name: "Jyoti Trading" },
  { id: 3, name: "Laxmi Engineering" },
  { id: 4, name: "Pooja Engineering" },
  { id: 5, name: "The Blue Beast" },
];

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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

  const getCompanyByName = (name: string) => {
    return companies.find(
      (company) => company.name.toLowerCase() === name.toLowerCase()
    );
  };

  const value = {
    companies,
    selectedCompany,
    setSelectedCompany,
    addCompany,
    getCompanyById,
    getCompanyByName,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
