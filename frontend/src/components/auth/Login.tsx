import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Building, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../backendUrl';
import { useUser } from '../../context/authContext';
import { useCompany } from '../../context/companyContext'; // Import the new context
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  
  const { user, setUser } = useUser();
  const { 
    companies, 
    selectedCompany, 
    setSelectedCompany 
  } = useCompany(); // Use the company context
  
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setShowCompanySelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Use the selectedCompany from context
    const companyName = selectedCompany?.name || '';
    
    const loginData = { 
      email, 
      password, 
      companyName: companyName.toLowerCase() 
    };
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/user/login`, loginData);
      if(response.data.status) {
        setUser({ email: email, role: response.data.role });
        localStorage.setItem("token", response.data.token);
        
        // Store selected company in localStorage for persistence
        if (selectedCompany) {
          localStorage.setItem("selectedCompanyId", selectedCompany.id.toString());
        }
        
        navigate("/");
      } else {
        toast.error(response.data.error || "There was an error while logging in.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email !== undefined) {
      navigate('/');
    }
    
    // Try to restore selected company from localStorage on component mount
    const savedCompanyId = localStorage.getItem("selectedCompanyId");
    if (savedCompanyId && !selectedCompany) {
      const company = companies.find(c => c.id === parseInt(savedCompanyId));
      if (company) {
        setSelectedCompany(company);
      }
    }
  }, [user, navigate, companies, selectedCompany, setSelectedCompany]);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 w-full">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md transition-transform transform hover:scale-105 duration-300 border border-gray-200">
        <div className="flex justify-center mb-4">
          <LogIn className="w-12 h-12 text-orange-500" />
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-center text-black mb-3">
          Welcome Back!
        </h2>
        <p className="text-xs text-center text-gray-600 mb-4">
          New here?{' '}
          <Link 
            to={'/signup'}
            className="font-semibold text-orange-500 hover:text-orange-700 transition-colors duration-200"
          >
            Create an account
          </Link>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-xs font-medium text-gray-700">
              Company Profile
            </label>
            <div className="relative">
              <div 
                onClick={() => setShowCompanySelector(!showCompanySelector)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200 cursor-pointer flex items-center justify-between"
              >
                {selectedCompany ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center overflow-hidden">
                      {selectedCompany.logo ? (
                        <img 
                          src={selectedCompany.logo} 
                          alt={selectedCompany.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <span>{selectedCompany.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Select your company</span>
                )}
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              
              {showCompanySelector && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2">Select Company</h3>
                    {companies.map((company) => (
                      <div 
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        className="p-2 hover:bg-orange-50 rounded-md cursor-pointer flex items-center justify-between transition-colors duration-150"
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center overflow-hidden">
                            {company.logo ? (
                              <img 
                                src={company.logo} 
                                alt={company.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <span className="text-sm">{company.name}</span>
                        </div>
                        {selectedCompany?.id === company.id && (
                          <CheckCircle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm transition duration-200 flex justify-center items-center"
            disabled={loading || !selectedCompany}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;