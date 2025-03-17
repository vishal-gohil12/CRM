import React, { useState } from 'react';
import { Users, DollarSign, LogOut, BookUser, Moon, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companyName?: string;
  logoUrl?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  companyName = "CRM System",
  logoUrl
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  
  const mainMenuItems = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
  ];
  
  const adminMenuItems = [
    { id: 'company', label: 'Company', icon: BookUser },
    { id: 'logout', label: 'Log out', icon: LogOut },
  ];
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark');
  };

  const getThemeClasses = () => {
    return {
      sidebar: theme === 'dark' 
        ? 'bg-black border-gray-800 text-white' 
        : 'bg-white border-gray-200 text-gray-800',
      activeItem: theme === 'dark'
        ? 'bg-orange-900 text-orange-400'
        : 'bg-orange-50 text-orange-600',
      hoverItem: theme === 'dark'
        ? 'hover:bg-gray-900 text-gray-300'
        : 'hover:bg-orange-50 text-gray-600',
      divider: theme === 'dark'
        ? 'border-gray-800'
        : 'border-gray-200',
      logo: theme === 'dark'
        ? 'text-orange-400'
        : 'text-orange-600',
    };
  };
  
  const themeClasses = getThemeClasses();

  // Render menu items
  const renderMenuItems = (items: typeof mainMenuItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      return (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          title={collapsed ? item.label : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 mb-2 rounded-lg transition-all ${
            activeTab === item.id
              ? themeClasses.activeItem
              : `${themeClasses.hoverItem} hover:bg-opacity-80`
          }`}
        >
          <Icon size={20} className={activeTab === item.id ? 'text-orange-500' : ''} />
          {!collapsed && <span className="font-medium">{item.label}</span>}
        </button>
      );
    });
  };

  return (
    <div className={`h-screen border-r transition-all duration-300 ${themeClasses.sidebar} ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}>
      {/* Logo and collapse toggle */}
      <div className={`flex items-center p-4 justify-between ${collapsed ? 'justify-center' : ''}`}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-8" />
        ) : (
          !collapsed && <h1 className={`text-xl font-bold ${themeClasses.logo}`}>{companyName}</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-opacity-10 hover:bg-gray-500"
        >
          <div className={`w-5 h-5 flex items-center justify-center transform ${collapsed ? 'rotate-180' : ''}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className={`w-4 h-4 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-grow mt-6 px-3">
        {renderMenuItems(mainMenuItems)}
        
        <div className={`my-4 border-t ${themeClasses.divider}`}></div>
        
        {renderMenuItems(adminMenuItems)}
      </nav>
      
      <div className="p-4">
        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 rounded-lg ${themeClasses.hoverItem}`}
        >
          {theme === 'dark' ? 
            <Sun size={20} className="text-orange-400" /> : 
            <Moon size={20} className="text-orange-600" />
          }
          {!collapsed && <span>Toggle theme</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;