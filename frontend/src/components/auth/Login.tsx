import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../backendUrl';
import { useUser } from '../../context/authContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loginData = { email, password, companyName };

    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/login`, loginData);
      if(response.data.status) {
        setUser({ email: email, role: response.data.role });
        localStorage.setItem("token", response.data.token);
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
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    if (user && user.email !== undefined) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col justify-center items-center px-4 w-full">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md transition-transform transform hover:scale-105 duration-300">
        <div className="flex justify-center mb-4">
          <LogIn className="w-12 h-12 text-black" />
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900 mb-3">
          Welcome Back!
        </h2>
        <p className="text-xs text-center text-gray-600 mb-4">
          New here?{' '}
          <Link 
            to={'/signup'}
            className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
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
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 text-xs transition duration-200"
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
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 text-xs transition duration-200"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-xs font-medium text-gray-700">
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              autoComplete="organization"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 text-xs transition duration-200"
              placeholder="Ex. Sunfiber"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm transition duration-200 flex justify-center items-center"
            disabled={loading}
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
