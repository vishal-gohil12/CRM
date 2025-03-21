import { useState } from "react";
import { Customer } from "../../context/clientContext";
import { BACKEND_URL } from "../../backendUrl";
import axios from "axios";
import toast from "react-hot-toast";
import { useCompany } from "../../context/companyContext";

interface UpdateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onCustomerUpdated: () => void;
}

export const UpdateCustomerModal: React.FC<UpdateCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}) => {
  const { selectedCompany } = useCompany();
  const [formData, setFormData] = useState({
    company_and_name: customer.company_and_name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    gst_no: customer.gst_no || 0,
    remark: customer.remark || "",
    companyName: selectedCompany?.name || "",
  });
  
  const [updating, setUpdating] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "gst_no" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    const payload = {
        ...formData,
        companyName: formData.companyName.toLowerCase(),
    };

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/customer/update`,
        payload,
        {
          headers: { authorization: localStorage.getItem("token") },
        }
      );

      if (response.data.status) {
        toast.success("Customer updated successfully");
        onCustomerUpdated();
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to update customer");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-90vh overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Update Customer
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company/Name
            </label>
            <input
              type="text"
              name="company_and_name"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter company name or client name"
              value={formData.company_and_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number
            </label>
            <input
              type="number"
              name="gst_no"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter GST number"
              value={formData.gst_no}
              onChange={handleChange}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              name="remark"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-24"
              placeholder="Enter any additional notes about this customer"
              value={formData.remark}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                updating ? "bg-orange-300" : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {updating ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
