import { Users, DollarSign, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void 
}) => {
  const menuItems = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'Log out', label: 'Log out', icon: LogOut }
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-8 px-4 hidden md:block">CRM System</h1>
      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-gray-100 text-black'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar