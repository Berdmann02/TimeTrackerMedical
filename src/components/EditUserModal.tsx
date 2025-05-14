import React, { useState, useEffect } from 'react';
import { User, Shield, X } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'Nurse' | 'pharmacist';
    isActive?: boolean;
    primarySite?: string;
    assignedSites?: string[];
  } | null;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'Nurse' | 'pharmacist';
  isActive: boolean;
  primarySite: string;
  assignedSites: string[];
}

const SITE_OPTIONS = [
  'All',
  'Ancora',
  'Center For Geriatrics- Keystone',
  'Choice Health',
  'CP El Paso',
  'CP Greater San Antonio',
  'CP Intermountain',
  'Dixie Care',
  'Finding Home Boise',
  'Finding Home Southeast Idaho',
  'Finding Homes Northern Utah',
  'Finding Homes Salt Lake',
  'Finding Homes Southern Utah',
  'Integrity Mental Health - Boise',
  'Jemericus',
  'Keystone Center For Geriatrics',
  'Keystone Healthcare',
  'OmniaCare',
  'Rocky Mountain Psych Pocatello',
  'Test Site'
];

const EditUserModal = ({ isOpen, onClose, user }: EditUserModalProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'Nurse',
    isActive: user?.isActive !== false,
    primarySite: user?.primarySite || '',
    assignedSites: user?.assignedSites || []
  });

  // Add effect to manage body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Update form when user changes
  React.useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      role: user?.role || 'Nurse',
      isActive: user?.isActive !== false,
      primarySite: user?.primarySite || '',
      assignedSites: user?.assignedSites || []
    });
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSiteCheckbox = (site: string) => {
    if (site === 'All') {
      setFormData(prev => ({
        ...prev,
        assignedSites: prev.assignedSites.includes('All') 
          ? []
          : SITE_OPTIONS
      }));
    } else {
      setFormData(prev => {
        const newAssignedSites = prev.assignedSites.includes(site)
          ? prev.assignedSites.filter(s => s !== site)
          : [...prev.assignedSites, site];
        
        if (prev.assignedSites.includes(site)) {
          return {
            ...prev,
            assignedSites: newAssignedSites.filter(s => s !== 'All')
          };
        }
        
        if (newAssignedSites.length === SITE_OPTIONS.length - 1 && 
            SITE_OPTIONS.every(s => s === 'All' || newAssignedSites.includes(s))) {
          return {
            ...prev,
            assignedSites: SITE_OPTIONS
          };
        }
        
        return {
          ...prev,
          assignedSites: newAssignedSites
        };
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section - Fixed */}
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
              <p className="mt-1 text-sm text-gray-600">
                Modify user account details and permissions
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

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

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 h-12">
                  <Shield className="text-gray-400" size={18} />
                  <span>New Password (leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 h-12">
                  <Shield className="text-gray-400" size={18} />
                  <span>Confirm New Password</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Site Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Primary Site
                </label>
                <select
                  name="primarySite"
                  value={formData.primarySite}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer appearance-none"
                  required
                >
                  <option value="">Select a primary site</option>
                  {SITE_OPTIONS.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Assigned Sites
                </label>
                <div className="border border-gray-300 rounded-lg h-[180px] overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {SITE_OPTIONS.map(site => (
                      <label
                        key={site}
                        className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedSites.includes(site)}
                          onChange={() => handleSiteCheckbox(site)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-gray-700">{site}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {formData.assignedSites.length} sites
                </p>
              </div>
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
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="Nurse">Nurse</option>
              </select>
            </div>

            {/* Inactive Status Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <X className="text-gray-400" size={18} />
                  Inactive Status
                </span>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={!formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: !e.target.checked }))}
                  className="ml-2 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-500">
                  {formData.isActive ? 'User account is active' : 'User account is inactive'}
                </span>
              </label>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal; 