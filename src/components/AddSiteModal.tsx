import React, { useState } from 'react';
import { createSite } from '../services/siteService';
import { toast } from 'react-hot-toast';
import { X, Building2, MapPin, Mail, Phone } from 'lucide-react';

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
  is_active: boolean;
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onSiteAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    is_active: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createSite(formData);
      toast.success('Site created successfully');
      onSiteAdded();
      onClose();
      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        is_active: true,
      });
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
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Site</h2>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Site Information Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Site Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      Site Name
                    </span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-text hover:bg-gray-100 transition-colors"
                    placeholder="Enter site name"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      Address
                    </span>
                  </label>
                  <input
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-text hover:bg-gray-100 transition-colors"
                    placeholder="Enter street address"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      City
                    </span>
                  </label>
                  <input
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-text hover:bg-gray-100 transition-colors"
                    placeholder="Enter city"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      State
                    </span>
                  </label>
                  <input
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-text hover:bg-gray-100 transition-colors"
                    placeholder="Enter state"
                  />
                </div>

                {/* ZIP Code */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      ZIP Code
                    </span>
                  </label>
                  <input
                    name="zip"
                    type="text"
                    value={formData.zip}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-text hover:bg-gray-100 transition-colors"
                    placeholder="Enter ZIP code"
                  />
                </div>

                {/* Active Status */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      Status
                    </span>
                  </label>
                  <div className="mt-1">
                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Active Site</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create Site"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSiteModal; 