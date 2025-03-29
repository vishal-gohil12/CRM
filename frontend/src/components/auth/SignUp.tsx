import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../../backendUrl";


const SignUp: React.FC = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const newUser = { 
      firstName, 
      lastName, 
      email, 
      password
    };

    try {
      const response = await axios.post(`${BACKEND_URL}/api/user/signup`, newUser);

      if (response.data.status) {
        navigate("/login");
        alert("Account created successfully!");
      } else {
        alert("There was an error during signup");
      }
    } catch (error) {
      alert("Something went wrong. Please try again later.");
      console.error("Sign-up error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 flex justify-center items-center px-2">
      <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <UserPlus className="w-12 h-12 text-black" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-2">
          Create Account
        </h2>
        <p className="text-xs text-center text-gray-600 mb-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            Sign in here
          </Link>
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="First Name"
            />
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Last Name"
            />
          </div>

          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Email Address"
          />

          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Password"
          />

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Confirm Password"
          />
          {/* Creative Role Selection */}


          <button
            type="submit"
            className="w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;