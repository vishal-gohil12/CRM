/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Building, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../backendUrl';
import { useUser } from '../../context/authContext';
import { useCompany } from '../../context/companyContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    company?: string;
  }>({});
  
  const { user, setUser } = useUser();
  const { companies, selectedCompany, setSelectedCompany } = useCompany();
  
  const navigate = useNavigate();

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setShowCompanySelector(false);
    // Clear any company-related errors when a company is selected
    setFieldErrors(prev => ({ ...prev, company: undefined }));
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    let isValid = true;
    
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    }
    
    if (!selectedCompany) {
      errors.company = "Please select your company";
      isValid = false;
    }
    
    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    
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
        
        if (selectedCompany) {
          localStorage.setItem("selectedCompanyId", selectedCompany.id.toString());
        }
        
        toast.success("Login successful! Redirecting...");
        navigate("/");
      } else {
        setErrorMessage(response.data.error || "There was an error while logging in.");
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 404) {
        setErrorMessage("Invalid credentials. Please check your email and password.");
        setFieldErrors({
          email: "Email or password is incorrect",
          password: "Email or password is incorrect"
        });
      } else if (error.response?.status === 401) {
        setErrorMessage("You're not authorized to access this company.");
        setFieldErrors({
          company: "You don't have access to this company"
        });
      } else {
        setErrorMessage(
          error.response?.data?.error ||
          error.response?.data?.message ||
          "An unexpected error occurred. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email !== undefined) {
      navigate('/');
    }
    
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

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Login Failed</p>
              <p className="text-xs text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

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
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              className={`mt-1 w-full px-3 py-2 border ${
                fieldErrors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: undefined }));
                }
              }}
              className={`mt-1 w-full px-3 py-2 border ${
                fieldErrors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="companyName" className="block text-xs font-medium text-gray-700">
              Company Profile
            </label>
            <div className="relative">
              <div 
                onClick={() => setShowCompanySelector(!showCompanySelector)}
                className={`mt-1 w-full px-3 py-2 border ${
                  fieldErrors.company ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200 cursor-pointer flex items-center justify-between`}
              >
                {selectedCompany ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center overflow-hidden">
                      <Building className="w-4 h-4 text-gray-600" />
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
              
              {fieldErrors.company && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.company}</p>
              )}
              
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
                              <Building className="w-4 h-4 text-gray-600" />
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

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-700">
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-orange-500 hover:text-orange-700 transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold ${
              loading || !selectedCompany 
                ? 'bg-orange-300 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm transition duration-200 flex justify-center items-center`}
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