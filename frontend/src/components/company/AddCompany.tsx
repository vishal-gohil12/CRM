import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../backendUrl";
import toast from "react-hot-toast";
import { Client, Transaction } from "../../types";
import { X, Building2, Briefcase, Loader2, Plus } from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string;
  customers: Client[];
  transactions: Transaction[];
}

interface Props {
  onClose: () => void;
  onCompanyAdded: (newCompany: Company) => void;
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Transportation",
  "Entertainment",
  "Food & Beverage",
  "Other"
];

const AddCompany: React.FC<Props> = ({ onClose, onCompanyAdded }) => {
  const [name, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({ name: "", industry: "" });

  const validateStep = () => {
    let valid = true;
    const newErrors = { name: "", industry: "" };

    if (step === 1 && !name.trim()) {
      newErrors.name = "Company name is required";
      valid = false;
    }

    if (step === 2 && !industry && !customIndustry) {
      newErrors.industry = "Please select or enter an industry";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setLoading(true);
    
    const finalIndustry = industry === "Other" ? customIndustry : industry;

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/company/add`,
        { name, industry: finalIndustry },
        {
          headers: {
            authorization: localStorage.getItem("token"),
          },
        }
      );

      if (res.data.status) {
        toast.success("Company created successfully");
        const newCompany: Company = {
          id: res.data.company.id,
          name: res.data.company.name,
          industry: res.data.company.industry,
          customers: [],
          transactions: []
        };
        onCompanyAdded(newCompany);
        onClose();
      }
    } catch {
      console.error("Failed to add company");
      toast.error("Error while adding company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-black p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {step === 1 ? "Add New Company" : "Company Industry"}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:bg-gray-700 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex mt-4">
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                step >= 1 ? "bg-white text-black" : "bg-gray-600 text-white"
              }`}>
                1
              </div>
              <div className={`h-1 w-10 ${
                step > 1 ? "bg-white" : "bg-gray-600"
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                step >= 2 ? "bg-white text-black" : "bg-gray-600 text-white"
              }`}>
                2
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-200 p-3 rounded-full">
                  <Building2 className="text-gray-800" />
                </div>
                <h3 className="text-lg font-medium">Company Information</h3>
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className={`w-full p-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              
              <div className="pt-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                  >
                    Continue <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-200 p-3 rounded-full">
                  <Briefcase className="text-gray-800" />
                </div>
                <h3 className="text-lg font-medium">Industry Selection</h3>
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">Select Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={`w-full p-3 border ${errors.industry ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors appearance-none bg-white`}
                >
                  <option value="">-- Select an industry --</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                {errors.industry && <p className="mt-1 text-sm text-red-500">{errors.industry}</p>}
              </div>

              {industry === "Other" && (
                <div className="mt-3">
                  <label className="block mb-2 font-medium text-gray-700">Specify Industry</label>
                  <input
                    type="text"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="Enter industry"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
              )}
              
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-xl transition duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    "Add Company"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddCompany;