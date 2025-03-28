import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import CustomerList from "./components/client/ClientList";
import Transactions from "./components/transaction/Transactions";
import { Menu } from "lucide-react";
import Login from "./components/auth/Login";
import { useUser } from "./context/authContext";
import { Routes, Route, useNavigate, Outlet } from "react-router-dom";
import SignUp from "./components/auth/SignUp";
import { Toaster } from "react-hot-toast";
import { CustomerProvider } from "./context/clientContext";
import { TransactionProvider } from "./context/TransactionContext";
import CompanyList from "./components/company/CompanyList";
import { CompanyProvider } from "./context/companyContext";
import ForgotPassword from "./components/auth/ForgotPass";
import AdminUserCreation from "./components/auth/admin/AdminUserCreation";

function AppContent() {
  const [activeTab, setActiveTab] = useState("clients");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, clearUser } = useUser();
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case "clients":
        return <CustomerList />;
      case "transactions":
        return <Transactions />;
      case "Log out":
        return <Logout clearUser={clearUser} />;
      case "company":
        return <CompanyList />;
      default:
        return <CustomerList />;
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate("/login");
    }
  }, [navigate, user]);

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-xl font-bold">CRM System</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      <div
        className={`
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        fixed md:static
        top-0 left-0
        h-full
        z-30
        transition-transform duration-300
        md:transition-none
        bg-white
      `}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
        />
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <main className="flex-1 overflow-auto">{renderContent()}</main>
    </div>
  );
}

const Logout = ({ clearUser }: { clearUser: () => void }) => {
  const navigate = useNavigate();

  useEffect(() => {
    clearUser();
    navigate("/login");
  }, [clearUser, navigate]);

  return null;
};

function ProtectedLayout() {
  return (
    <CustomerProvider>
      <TransactionProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Outlet />
      </TransactionProvider>
    </CustomerProvider>
  );
}

function App() {
  return (
    <CompanyProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/admin" element={<AdminUserCreation />} />
        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<AppContent />} />
          <Route path="/company" element={<CompanyList />} />
        </Route>
      </Routes>
    </CompanyProvider>
  );
}

export default App;
