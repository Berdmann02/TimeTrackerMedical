import React, { useState, useEffect, useRef } from 'react';
import { createSite } from '../services/siteService';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

// Helper function to capitalize only the first letter of the string
const capitalizeWords = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteAdded: () => void;
}

interface SiteFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

// This matches the expected type from the service
interface CreateSiteDto extends SiteFormData {
  is_active: boolean;
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onSiteAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevIsOpen = useRef(isOpen);
  
  const initialFormData: SiteFormData = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  };

  const [formData, setFormData] = useState<SiteFormData>(initialFormData);

  // Reset form when modal is closed
  useEffect(() => {
    // If modal was open and is now closed, reset the form
    if (prevIsOpen.current && !isOpen) {
      setFormData(initialFormData);
      setIsSubmitting(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'name' || name === 'city') {
      processedValue = capitalizeWords(value);
    } else if (name === 'state') {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const siteData: CreateSiteDto = { ...formData, is_active: true };
      await createSite(siteData);
      toast.success('Site created successfully');
      onSiteAdded();
      onClose();
    } catch (error) {
      console.error('Error creating site:', error);
      toast.error('Failed to create site');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                Add New Site
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Please fill in all the required information to create a new site.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Site Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter site name"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter street address"
              />
            </div>

            {/* City, State, ZIP Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  name="zip"
                  type="text"
                  value={formData.zip}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                  placeholder="Enter ZIP code"
                />
              </div>
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
                  'Create Site'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSiteModal; 