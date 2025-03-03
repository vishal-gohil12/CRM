import { useState } from 'react';
import { useUser } from '../context/authContext';
import axios from 'axios';
import { BACKEND_URL } from '../backendUrl';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddCompany = () => {
  const [name, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const navigate = useNavigate();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const company = { name, industry };
    try {
      const res = await axios.post(`${BACKEND_URL}/api/company/add`, company, {
        headers: {
          authorization: localStorage.getItem('token')
        }
      });

      if(res.data.status) {
        toast.success("Company is create successfully");
        navigate('/');
      }
    } catch {
      console.error("Failed to add company");
      toast.error('Error while adding company');
    }
    
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md p-6 shadow-lg bg-white rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-6 shadow-lg bg-white rounded-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Add New Company</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium">Company Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Enter company name"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block mb-1 font-medium">Industry</label>
            <input
              id="industry"
              name="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              placeholder="Enter industry"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition duration-300"
          >
            Add Company
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCompany;
