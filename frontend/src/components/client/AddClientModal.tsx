import { useState } from "react";
import { useCustomers } from "../../context/clientContext";
import { useCompany } from "../../context/companyContext"; // Import company context
import toast from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "../../backendUrl";
import { X, Building } from "lucide-react";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: () => void;
}



export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
}) => {
  const { customers } = useCustomers();
  const { selectedCompany } = useCompany();

  const [formData, setFormData] = useState({
    company_and_name: "",
    email: "",
    phone: "",
    gst_no: "",
    remark: "",
    documents: [] as string[],
    companyName: selectedCompany?.name || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.company_and_name.trim())
      newErrors.company_and_name = "Company and Name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    } else if (
      customers.some((customer) => customer.email === formData.email)
    ) {
      toast.error("A customer with this email already exists");
      return false;
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!formData.companyName) {
      newErrors.companyName = "Please select a company profile";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validate()) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        companyName: formData.companyName.toLowerCase(),
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/customer/add_customer`,
        payload,
        {
          headers: {
            authorization: localStorage.getItem("token"),
          },
        }
      );

      if (response.data.status) {
        toast.success("Customer added successfully!");
        onCustomerAdded();
        onClose();
      } else {
        toast.error(response.data.error || "Failed to add customer");
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Error while adding customer");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Customer</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Company Profile Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adding customer to:
              </label>
              {selectedCompany ? (
                <div className="flex items-center p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-full mr-3 flex items-center justify-center overflow-hidden">
                    <Building className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="font-medium text-gray-800">
                    {selectedCompany.name}
                  </span>
                </div>
              ) : (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  No company selected. Please select a company from your profile
                  first.
                </div>
              )}
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company and Name *
              </label>
              <input
                type="text"
                required
                value={formData.company_and_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_and_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                placeholder="ABC Corp. - John Doe"
              />
              {errors.company_and_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.company_and_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number *
              </label>
              <input
                type="text"
                value={formData.gst_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gst_no: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
              {errors.gst_no && (
                <p className="text-red-500 text-xs mt-1">{errors.gst_no}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remark
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center"
              disabled={isLoading || !selectedCompany}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                  viewBox="0 0 24 24"
                ></svg>
              ) : (
                "Add Customer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
