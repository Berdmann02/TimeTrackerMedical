import { useState } from 'react';
import { User, Shield, X } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'generic' | 'pharmacist';
}

const AddUserModal = ({ isOpen, onClose }: AddUserModalProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'generic'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
              <p className="mt-1 text-sm text-gray-600">
                Add a new user account to the system
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="text-gray-400" size={18} />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
                placeholder="user@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Shield className="text-gray-400" size={18} />
                <span>Password</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Shield className="text-gray-400" size={18} />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Role Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Shield className="text-gray-400" size={18} />
                <span>Role</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer appearance-none"
                required
              >
                <option value="generic">Generic</option>
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal; 