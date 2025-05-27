import { useState, useEffect } from 'react';
import { User, Calendar, Building2, MapPin, X } from 'lucide-react';
import { createPatient, type CreatePatientDTO } from '../services/patientService';
import { getSites, type Site } from '../services/siteService';
import { getBuildingsBySiteId, type Building } from '../services/buildingService';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: () => void;
  defaultSite?: string;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  siteId: string;
  building: string;
  insurance: string;
  notes: string;
}

const AddPatientModal = ({ isOpen, onClose, onPatientAdded, defaultSite }: AddPatientModalProps) => {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    siteId: defaultSite || '',
    building: '',
    insurance: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      setIsLoadingSites(true);
      try {
        const sitesData = await getSites();
        setSites(sitesData.filter(site => site.is_active));
        
        // If defaultSite is provided, find its ID and set it
        if (defaultSite) {
          const defaultSiteObj = sitesData.find(site => site.name === defaultSite);
          if (defaultSiteObj) {
            setFormData(prev => ({
              ...prev,
              siteId: defaultSiteObj.id.toString()
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
        setError('Failed to load sites. Please try again.');
      } finally {
        setIsLoadingSites(false);
      }
    };

    if (isOpen) {
      fetchSites();
    }
  }, [isOpen, defaultSite]);

  // Fetch buildings when site changes
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!formData.siteId) return;
      
      setIsLoadingBuildings(true);
      try {
        const buildingsData = await getBuildingsBySiteId(parseInt(formData.siteId));
        setBuildings(buildingsData.filter(building => building.is_active));
      } catch (err) {
        console.error('Error fetching buildings:', err);
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [formData.siteId]);

  // Update scroll lock effect
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      // Add both overflow hidden and position fixed to prevent any scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Restore original styles
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      // Cleanup function to restore original styles
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  // Update formData when defaultSite changes
  useEffect(() => {
    if (defaultSite) {
      setFormData(prev => ({
        ...prev,
        siteId: defaultSite
      }));
    }
  }, [defaultSite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Map the form data to the DTO format
      const patientData: CreatePatientDTO = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        birthdate: formData.dateOfBirth,
        gender: formData.gender,
        site_name: sites.find(site => site.id.toString() === formData.siteId)?.name || '',
        insurance: formData.insurance,
        is_active: true
      };
      
      await createPatient(patientData);
      
      // Notify parent component that a patient was added
      if (onPatientAdded) {
        onPatientAdded();
      }
      
      onClose();
    } catch (err) {
      console.error('Failed to create patient:', err);
      setError('Failed to create patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset building when site changes
      if (name === 'siteId') {
        newData.building = '';
      }
      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50 overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Patient</h2>
              <p className="mt-1 text-sm text-gray-600">
                Please fill in all the required information to create a new patient record.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* First Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="text-indigo-600" size={18} />
                    <span>First Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors duration-200"
                  required
                  placeholder="Enter patient's first name"
                />
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="text-indigo-600" size={18} />
                    <span>Last Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors duration-200"
                  required
                  placeholder="Enter patient's last name"
                />
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={18} />
                    <span>Date of Birth</span>
                  </div>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer"
                  required
                />
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="text-blue-600" size={18} />
                    <span>Gender</span>
                  </div>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer"
                  required
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              {/* Site ID Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-blue-600" size={18} />
                    <span>Site</span>
                  </div>
                </label>
                <select
                  name="siteId"
                  value={formData.siteId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={isLoadingSites}
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="text-blue-600" size={18} />
                    <span>Building</span>
                  </div>
                </label>
                <select
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.siteId || isLoadingBuildings}
                >
                  <option value="">Select a building</option>
                  {buildings.map(building => (
                    <option key={building.id} value={building.name}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Insurance Field */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-blue-600 w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>Insurance</span>
                </div>
              </label>
              <input
                type="text"
                name="insurance"
                value={formData.insurance}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter insurance information"
              />
            </div>

            {/* Notes Field */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  {/* Using a generic icon for notes, replace if a more specific one is available */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-blue-600 w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span>Notes</span>
                </div>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter any relevant notes for the patient..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <User size={18} />
                {isSubmitting ? 'Creating...' : 'Create Patient Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal; 