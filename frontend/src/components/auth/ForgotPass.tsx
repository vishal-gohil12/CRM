/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { BACKEND_URL } from "../../backendUrl";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const navigate = useNavigate();

  // Validate email for OTP request
  const validateEmailStep = () => {
    // eslint-disable-next-line prefer-const
    let errors: any = {};
    let isValid = true;
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
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
        `${BACKEND_URL}/api/user/forgot-password`,
        { email }
      );
      if (response.data.status) {
        toast.success("OTP sent to your email");
        setStep(2);
      } else {
        setErrorMessage(response.data.error || "Failed to send OTP");
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Validate OTP and new password fields for password reset
  const validateResetStep = () => {
    // eslint-disable-next-line prefer-const
    let errors: any = {};
    let isValid = true;

    if (!otp) {
      errors.otp = "OTP is required";
      isValid = false;
    }
    if (!newPassword) {
      errors.newPassword = "New password is required";
      isValid = false;
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    setFieldErrors(errors);
    return isValid;
  };

  // Verify OTP and reset the password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validateResetStep()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/reset-password`,
        { email, otp, newPassword }
      );
      if (response.data.status) {
        toast.success("Password reset successful. Redirecting to login...");
        navigate("/login");
      } else {
        setErrorMessage(response.data.error || "Failed to reset password");
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 w-full">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md transition-transform transform hover:scale-105 duration-300 border border-gray-200">
        {step === 1 && (
          <>
            <h2 className="text-xl sm:text-2xl font-extrabold text-center text-black mb-3">
              Forgot Password
            </h2>
            <p className="text-xs text-center text-gray-600 mb-4">
              Enter your email to receive an OTP for password reset.
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
                  placeholder="you@example.com"
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
            <p className="mt-4 text-center text-xs text-gray-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-700 transition-colors duration-200 font-semibold"
              >
                Login
              </Link>
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl sm:text-2xl font-extrabold text-center text-black mb-3">
              Reset Password
            </h2>
            <p className="text-xs text-center text-gray-600 mb-4">
              Enter the OTP sent to your email and your new password.
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
            <form onSubmit={handleResetPassword} className="space-y-4">
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
                  htmlFor="newPassword"
                  className="block text-xs font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        newPassword: undefined,
                      }));
                    }
                  }}
                  className={`mt-1 w-full px-3 py-2 border ${
                    fieldErrors.newPassword
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 text-xs transition duration-200`}
                  placeholder="New password"
                  required
                />
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.newPassword}
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
                  placeholder="Confirm new password"
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
                  "Reset Password"
                )}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-gray-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-700 transition-colors duration-200 font-semibold"
              >
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
