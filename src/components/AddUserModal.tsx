import { useState, useEffect } from "react";
import { User, Calendar, Building2, MapPin, X } from "lucide-react";
import { createUser, type CreateUserDTO } from "../services/userService";
import { getAllSiteNames } from "../services/siteService";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
  defaultPrimarySite?: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "admin" | "nurse" | "pharmacist";
  primarySite: string;
  assignedSites: string[];
}

const AddUserModal = ({ isOpen, onClose, onUserAdded, defaultPrimarySite }: AddUserModalProps) => {
  const initialFormData: UserFormData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "nurse" as "admin" | "nurse" | "pharmacist",
    primarySite: defaultPrimarySite || "",
    assignedSites: defaultPrimarySite ? [defaultPrimarySite] : [],
  };

  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [sites, setSites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitesError, setSitesError] = useState<string | null>(null);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setError(null);
      setIsSubmitting(false);
      fetchSites();
    }
  }, [isOpen]);

  const fetchSites = async () => {
    setIsLoading(true);
    setSitesError(null);
    try {
      const siteData = await getAllSiteNames();
      setSites(["All", ...siteData]);
    } catch (err) {
      setSitesError("Failed to load sites. Please try again.");
      console.error("Error loading sites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const userData: CreateUserDTO = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        primarysite: formData.primarySite,
        assignedsites: formData.assignedSites,
      };

      await createUser(userData);

      if (onUserAdded) {
        onUserAdded();
      }
      onClose();
    } catch (error) {
      console.error("Failed to create user:", error);
      setError(error instanceof Error ? error.message : "Failed to create user. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSiteCheckbox = (site: string) => {
    if (site === 'All') {
      // If "All" is selected, set all sites including "All" itself
      setFormData(prev => ({
        ...prev,
        assignedSites: prev.assignedSites.includes('All') 
          ? [] // If "All" was checked, uncheck everything
          : sites // Check all sites including "All"
      }));
    } else {
      setFormData(prev => {
        const newAssignedSites = prev.assignedSites.includes(site)
          ? prev.assignedSites.filter(s => s !== site)
          : [...prev.assignedSites, site];
        
        // Remove "All" if any individual site is unchecked
        if (prev.assignedSites.includes(site)) {
          return {
            ...prev,
            assignedSites: newAssignedSites.filter(s => s !== 'All')
          };
        }
        
        // Add "All" if all other sites are selected
        if (newAssignedSites.length === sites.length - 1 && 
            sites.every(s => s === 'All' || newAssignedSites.includes(s))) {
          return {
            ...prev,
            assignedSites: sites
          };
        }
        
        return {
          ...prev,
          assignedSites: newAssignedSites
        };
      });
    }
  };

  if(!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

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
              <label className="text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
                placeholder="user@example.com"
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
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
                  disabled={isLoading}
                >
                  <option value="">Select a primary site</option>
                  {sites.filter(site => site !== 'All').map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Assigned Sites
                </label>
                <div className="border border-gray-300 rounded-lg h-[180px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : sitesError ? (
                    <div className="p-4 text-center">
                      <p className="text-red-500 text-sm mb-2">{sitesError}</p>
                      <button
                        onClick={fetchSites}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {sites.map(site => (
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
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {formData.assignedSites.length} sites
                </p>
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer appearance-none"
                required
              >
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="nurse">Nurse</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
};


export default AddUserModal;