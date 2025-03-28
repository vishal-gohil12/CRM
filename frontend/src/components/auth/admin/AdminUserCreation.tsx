import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../../../backendUrl';

const AdminUserCreation: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    otp?: string;
    adminUsername?: string;
    adminPassword?: string;
    confirmPassword?: string;
  }>({});

  const navigate = useNavigate();

  // Validate email for OTP request
  const validateEmailStep = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Request OTP to be sent to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validateEmailStep()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/admin/create-request`,
        { email }
      );

      if (response.data.status) {
        toast.success('OTP sent to your email for admin creation');
        setStep(2);
      } else {
        setErrorMessage(response.data.error || 'Failed to send OTP');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  // Validate OTP and admin user creation fields
  const validateAdminCreationStep = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    if (!otp) {
      errors.otp = 'OTP is required';
      isValid = false;
    }

    if (!adminUsername) {
      errors.adminUsername = 'Admin username is required';
      isValid = false;
    }

    if (!adminPassword) {
      errors.adminPassword = 'Admin password is required';
      isValid = false;
    }

    if (adminPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Create admin user
  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validateAdminCreationStep()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/admin/create-user`,
        { email, otp, adminUsername, adminPassword }
      );

      if (response.data.status) {
        toast.success('Admin user created successfully!');
        navigate('/login');
      } else {
        setErrorMessage(response.data.error || 'Failed to create admin user');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col justify-center items-center px-4 w-full">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md transition-transform transform hover:scale-105 duration-300 border border-gray-200">
        {step === 1 && (
          <>
            <div className="flex justify-center mb-4">
              <ShieldCheck className="w-16 h-16 text-orange-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-center text-black mb-3">
              Create Admin User
            </h2>
            <p className="text-xs text-center text-gray-600 mb-4">
              Enter your email to receive an OTP for admin user creation.
            </p>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Error</p>
                  <p className="text-xs text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: undefined,
                      }));
                    }
                  }}
                  className={`mt-1 w-full px-3 py-2 border ${
                    fieldErrors.email
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
                  placeholder="admin@example.com"
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold ${
                  loading
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm transition duration-200 flex justify-center items-center`}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          </>
        )}
        {step === 2 && (
          <>
            <div className="flex justify-center mb-4">
              <ShieldCheck className="w-16 h-16 text-orange-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-center text-black mb-3">
              Create Admin Credentials
            </h2>
            <p className="text-xs text-center text-gray-600 mb-4">
              Enter the OTP and set up your admin account.
            </p>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Error</p>
                  <p className="text-xs text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateAdminUser} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-medium text-gray-700"
                >
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (fieldErrors.otp) {
                      setFieldErrors((prev) => ({ ...prev, otp: undefined }));
                    }
                  }}
                  className={`mt-1 w-full px-3 py-2 border ${
                    fieldErrors.otp
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
                  placeholder="Enter OTP"
                  required
                />
                {fieldErrors.otp && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.otp}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="adminUsername"
                  className="block text-xs font-medium text-gray-700"
                >
                  Admin Username
                </label>
                <input
                  id="adminUsername"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => {
                    setAdminUsername(e.target.value);
                    if (fieldErrors.adminUsername) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        adminUsername: undefined,
                      }));
                    }
                  }}
                  className={`mt-1 w-full px-3 py-2 border ${
                    fieldErrors.adminUsername
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
                  placeholder="Admin username"
                  required
                />
                {fieldErrors.adminUsername && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.adminUsername}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="adminPassword"
                  className="block text-xs font-medium text-gray-700"
                >
                  Admin Password
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (fieldErrors.adminPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        adminPassword: undefined,
                      }));
                    }
                  }}
                  className={`mt-1 w-full px-3 py-2 border ${
                    fieldErrors.adminPassword
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
                  placeholder="Admin password"
                  required
                />
                {fieldErrors.adminPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.adminPassword}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                  className={`mt-1 w-full px-3 py-2 border ${
                    fieldErrors.confirmPassword
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
                  placeholder="Confirm admin password"
                  required
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold ${
                  loading
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm transition duration-200 flex justify-center items-center`}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Create Admin User"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserCreation;