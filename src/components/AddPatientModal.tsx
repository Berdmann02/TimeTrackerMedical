import { useState } from 'react';
import { User, Calendar, Building2, MapPin, X } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PatientFormData {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  siteId: string;
  building: string;
}

const siteOptions = [
  { id: 'cpgsa', name: 'CP Greater San Antonio' },
  { id: 'cpim', name: 'CP Intermountain' }
];

const buildingOptions = {
  cpgsa: [
    { id: 'med1', name: 'Medical Building 1' },
    { id: 'med2', name: 'Medical Building 2' },
    { id: 'rehab1', name: 'Rehabilitation Center' },
    { id: 'spec1', name: 'Specialty Care Center' },
    { id: 'emer1', name: 'Emergency Care Unit' },
    { id: 'peds1', name: 'Pediatric Center' }
  ],
  cpim: [
    { id: 'main', name: 'Main Hospital' },
    { id: 'clinic1', name: 'Outpatient Clinic' },
    { id: 'therapy', name: 'Therapy Center' },
    { id: 'diag1', name: 'Diagnostic Center' },
    { id: 'surg1', name: 'Surgical Center' },
    { id: 'rehab2', name: 'Rehabilitation Wing' }
  ]
};

const AddPatientModal = ({ isOpen, onClose }: AddPatientModalProps) => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    dateOfBirth: '',
    gender: 'male',
    siteId: '',
    building: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      className="fixed inset-0 backdrop-blur-[2px] bg-white/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name Field */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="text-indigo-600" size={18} />
                    <span>Full Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  required
                  placeholder="Enter patient's full name"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  required
                >
                  <option value="">Select a site</option>
                  {siteOptions.map(site => (
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  required
                  disabled={!formData.siteId}
                >
                  <option value="">Select a building</option>
                  {formData.siteId && buildingOptions[formData.siteId as keyof typeof buildingOptions].map(building => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <User size={18} />
                Create Patient Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal; 