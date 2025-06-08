import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, X } from 'lucide-react';
import { updateUser, type User as UserType } from "../services/userService";
import { getSites, type Site } from "../services/siteService";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
  user: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: "admin" | "nurse" | "pharmacist";
    primarySite?: string;
    assignedSites?: string[];
  } | null;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "nurse" | "pharmacist";
  primarySiteId: string;
  assignedSiteIds: string[];
  newPassword: string;
  confirmPassword: string;
}

const EditUserModal = ({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) => {
  const initialFormData: UserFormData = {
    firstName: "",
    lastName: "",
    email: "",
    role: "nurse",
    primarySiteId: "",
    assignedSiteIds: [],
    newPassword: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const prevIsOpen = useRef(isOpen);

  // Reset form when modal is closed
  useEffect(() => {
    // If modal was open and is now closed, reset the form
    if (prevIsOpen.current && !isOpen) {
      setFormData(initialFormData);
      setError(null);
      setIsSubmitting(false);
      setSites([]);
      setSitesError(null);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Reset and populate form when user data changes
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        role: user.role,
        primarySiteId: "", // Will be set after sites are loaded
        assignedSiteIds: [], // Will be set after sites are loaded
        newPassword: "",
        confirmPassword: "",
      });
      setError(null);
      setIsSubmitting(false);
      fetchSites();
    }
  }, [user, isOpen]);

  const fetchSites = async () => {
    setIsLoading(true);
    setSitesError(null);
    try {
      const siteData = await getSites();
      const activeSites = siteData.filter(site => site.is_active);
      setSites(activeSites);
      
      // After sites are loaded, map site names to IDs
      if (user) {
        const primarySiteObj = activeSites.find(site => site.name === user.primarySite);
        const assignedSiteObjs = activeSites.filter(site => 
          user.assignedSites?.includes(site.name)
        );
        
        setFormData(prev => ({
          ...prev,
          primarySiteId: primarySiteObj ? primarySiteObj.id.toString() : "",
          assignedSiteIds: assignedSiteObjs.map(site => site.id.toString())
        }));
      }
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
    if (!user?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate password fields if any password field is filled
      if (formData.newPassword || formData.confirmPassword) {
        if (!formData.newPassword) {
          setError("Current password is required to change password");
          setIsSubmitting(false); 
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError("New password and confirm password do not match");
          setIsSubmitting(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError("New password must be at least 6 characters long");
          setIsSubmitting(false);
          return;
        }
      }

      const userData: Partial<UserType> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        role: formData.role,
        primarysite_id: parseInt(formData.primarySiteId),
        assignedsites_ids: formData.assignedSiteIds.map(id => parseInt(id)),
      };
      
      if (formData.newPassword) {
        userData.new_password = formData.newPassword;
      }

      // Use the original email as identifier (user.id is actually the email in our case)
      await updateUser(user.id, userData);

      if (onUserUpdated) {
        onUserUpdated();
      }
      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      setError(error instanceof Error ? error.message : "Failed to update user. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSiteCheckbox = (siteId: string) => {
    setFormData(prev => {
      const newAssignedSiteIds = prev.assignedSiteIds.includes(siteId)
        ? prev.assignedSiteIds.filter(id => id !== siteId)
        : [...prev.assignedSiteIds, siteId];
      
      return {
        ...prev,
        assignedSiteIds: newAssignedSiteIds
      };
    });
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
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
              <p className="mt-1 text-sm text-gray-600">
                Update user information
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
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
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
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
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
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                required
                placeholder="user@example.com"
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                  placeholder="••••••••"
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
                  name="primarySiteId"
                  value={formData.primarySiteId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select a primary site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
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
                          key={site.id}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedSiteIds.includes(site.id.toString())}
                            onChange={() => handleSiteCheckbox(site.id.toString())}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                          />
                          <span className="ml-2 text-gray-700">{site.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {formData.assignedSiteIds.length} sites
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
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
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
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;