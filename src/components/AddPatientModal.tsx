import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPatient } from '../services/patientService';
import type { CreatePatientDto } from '../types/patient';
import { getSites, type Site } from '../services/siteService';
import { getBuildingsBySiteId, type Building } from '../services/buildingService';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: () => void;
  defaultSite?: string;
  defaultSiteId?: number;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  site_name: string;
  building: string;
  insurance: string;
  notes: string;
  medicalRecords: string;
}

const AddPatientModal = ({ isOpen, onClose, onPatientAdded, defaultSite, defaultSiteId }: AddPatientModalProps) => {
  const initialFormData: PatientFormData = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    site_name: defaultSite || '',
    building: '',
    insurance: '',
    notes: '',
    medicalRecords: 'initial'
  };

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const prevIsOpen = useRef(isOpen);

  // Reset form when modal is closed
  useEffect(() => {
    // If modal was open and is now closed, reset the form
    if (prevIsOpen.current && !isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'M',
        site_name: defaultSite || '',
        building: '',
        insurance: '',
        notes: '',
        medicalRecords: 'initial'
      });
      setError(null);
      setIsSubmitting(false);
      setSites([]);
      setBuildings([]);
    }
    // If modal is opened, fetch sites
    if (isOpen && !prevIsOpen.current) {
      fetchSites();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, defaultSite, defaultSiteId]);

  const fetchSites = async () => {
    setIsLoadingSites(true);
    try {
      const sitesData = await getSites();
      setSites(sitesData.filter(site => site.is_active));
      
      // If defaultSite is provided, set it directly
      if (defaultSite) {
        setFormData(prev => ({
          ...prev,
          site_name: defaultSite
        }));
      }
      // If defaultSiteId is provided, find the corresponding site name
      else if (defaultSiteId) {
        const defaultSiteObj = sitesData.find(site => site.id === defaultSiteId);
        if (defaultSiteObj) {
          setFormData(prev => ({
            ...prev,
            site_name: defaultSiteObj.name
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

  // Fetch buildings when site changes
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!formData.site_name) return;
      
      setIsLoadingBuildings(true);
      try {
        // Find the site ID from the site name
        const selectedSite = sites.find(site => site.name === formData.site_name);
        if (selectedSite) {
          const buildingsData = await getBuildingsBySiteId(selectedSite.id);
          setBuildings(buildingsData.filter(building => building.is_active));
        }
      } catch (err) {
        console.error('Error fetching buildings:', err);
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [formData.site_name, sites]);

  // Update scroll lock effect
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
    
    try {
      // Map the form data to the DTO format
      const patientData: CreatePatientDto = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        birthdate: formData.dateOfBirth,
        gender: formData.gender,
        site_name: formData.site_name,
        building: formData.building || undefined,
        insurance: formData.insurance,
        is_active: true,
        medical_records: formData.medicalRecords,
        notes: formData.notes
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
      if (name === 'site_name') {
        newData.building = '';
      }
      return newData;
    });
  };

  if (!isOpen) return null;

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
              <h2 className="text-2xl font-bold text-gray-900">Create New Patient</h2>
              <p className="mt-1 text-sm text-gray-600">
                Add a new patient record to the system
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

            {/* Date of Birth and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
                  required
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>

            {/* Site and Building */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Site
                </label>
                <select
                  name="site_name"
                  value={formData.site_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
                  required
                  disabled={isLoadingSites}
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.name}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Building
                </label>
                <select
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 cursor-pointer appearance-none"
                  required
                  disabled={!formData.site_name || isLoadingBuildings}
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
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Insurance
              </label>
              <input
                type="text"
                name="insurance"
                value={formData.insurance}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter insurance information"
              />
            </div>

            {/* Notes Field */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                placeholder="Enter any relevant notes for the patient..."
              />
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
                  'Create Patient'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal; 