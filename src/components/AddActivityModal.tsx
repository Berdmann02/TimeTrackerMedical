import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaHospital,
  FaClipboardList,
  FaClock,
  FaStickyNote,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import { getPatients } from "../services/patientService";
import type { Patient } from "../services/patientService";
import { createActivity, getActivityTypes } from "../services/activityService";
import type { CreateActivityDTO } from "../services/activityService";
import { X } from "lucide-react";

interface ActivityForm {
  patientId: string;
  siteId: string;
  activityType: string;
  startTime: string;
  endTime: string;
  notes: string;
  userInitials: string;
  isPharmacist: boolean;
}

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityAdded?: () => void;
  patientId?: string;
  patientName?: string;
  siteName?: string;
  // Optional patients list to avoid loading
  patients?: Patient[];
}

const AddActivityModal: React.FC<AddActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  onActivityAdded,
  patientId: initialPatientId,
  patientName,
  siteName,
  patients: providedPatients = [] 
}) => {
  const [patients, setPatients] = useState<Patient[]>(providedPatients);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(providedPatients.length === 0);
  
  const [formData, setFormData] = useState<ActivityForm>({
    patientId: initialPatientId || "",
    siteId: siteName === "CP Intermountain" ? "cp-intermountain" : "cp-san-antonio",
    activityType: "",
    startTime: "",
    endTime: "",
    notes: "",
    userInitials: "",
    isPharmacist: false
  });

  const [isTracking, setIsTracking] = useState(false);

  // Update patients state when providedPatients changes
  useEffect(() => {
    if (providedPatients.length > 0) {
      setPatients(providedPatients);
      setIsLoadingData(false);
    }
  }, [providedPatients]);

  // Reset form when modal opens or when initialPatientId changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      patientId: initialPatientId || "",
      siteId: siteName === "CP Intermountain" ? "cp-intermountain" : "cp-san-antonio",
    }));
  }, [initialPatientId, siteName, isOpen]);

  // Fetch activity types and patients if needed
  useEffect(() => {
    if (!isOpen) return; // Only fetch data when modal is open
    
    const fetchData = async () => {
      setError(null);
      
      try {
        // Always fetch activity types
        const activityTypesData = await getActivityTypes();
        setActivityTypes(activityTypesData);
        
        // Only fetch patients if we don't have them already
        if (patients.length === 0) {
          setIsLoadingData(true);
          const patientsData = await getPatients();
          setPatients(patientsData);
          setIsLoadingData(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load required data. Please try again.");
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [isOpen, patients.length]);

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    
    // Special handling for datetime-local input
    if (name === 'startTime' || name === 'endTime') {
      // Convert the datetime-local value to ISO string format
      if (value) {
        const date = new Date(value);
        const isoString = date.toISOString();
        setFormData(prev => ({
          ...prev,
          [name]: isoString
        }));
      }
    } else {
      // Default handling for other inputs
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleStartTime = () => {
    const now = new Date().toISOString();
    // Allow restarting even after stopping (having an end time)
    setFormData((prev) => ({ ...prev, startTime: now, endTime: "" }));
    setIsTracking(true);
  };

  const handleEndTime = () => {
    // Only set endTime if we're currently tracking
    if (isTracking) {
      const now = new Date().toISOString();
      setFormData((prev) => ({ ...prev, endTime: now }));
      setIsTracking(false);
    }
  };

  const calculateTimeDifference = (): number => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(formData.startTime).getTime();
    const end = new Date(formData.endTime).getTime();
    
    // Return time difference in minutes
    return Math.max(0, (end - start) / (1000 * 60));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.activityType || !formData.userInitials) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (!formData.startTime || !formData.endTime) {
      alert("Please track time by using the Start and Stop buttons");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const activityData: CreateActivityDTO = {
        patient_id: parseInt(formData.patientId),
        activity_type: formData.activityType,
        user_initials: formData.userInitials,
        is_pharmacist: formData.isPharmacist,
        time_spent: calculateTimeDifference(),
        notes: formData.notes
      };
      
      await createActivity(activityData);
      
      // Notify parent component
      if (onActivityAdded) {
        onActivityAdded();
      }
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error creating activity:", err);
      setError("Failed to create activity. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Find selected patient details
  const selectedPatient = patients.find(p => p.id.toString() === formData.patientId);
  const selectedPatientName = selectedPatient 
    ? `${selectedPatient.last_name}, ${selectedPatient.first_name}`
    : patientName && initialPatientId === formData.patientId ? patientName : "";

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-gray-500/30 flex items-center justify-center z-50"
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
              <h2 className="text-2xl font-bold text-gray-900">Add New Activity</h2>
              <p className="mt-1 text-sm text-gray-600">
                {selectedPatientName || "Please fill in all the required information to track an activity."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {isLoadingData ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4 text-5xl">!</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient and Site Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Patient - Always allow selection */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaUser className="w-4 h-4 text-gray-400 mr-2" />
                      Patient
                    </span>
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.last_name}, {patient.first_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Site */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaHospital className="w-4 h-4 text-gray-400 mr-2" />
                      Site Location
                    </span>
                  </label>
                  <select
                    name="siteId"
                    value={formData.siteId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    required
                  >
                    <option value="cp-san-antonio">CP Greater San Antonio</option>
                    <option value="cp-intermountain">CP Intermountain</option>
                  </select>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* User Initials */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaUser className="w-4 h-4 text-gray-400 mr-2" />
                      Your Initials
                    </span>
                  </label>
                  <input
                    type="text"
                    name="userInitials"
                    value={formData.userInitials}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                    placeholder="e.g., JD"
                    maxLength={5}
                    required
                  />
                </div>

                {/* Is Pharmacist */}
                <div className="space-y-1.5 flex items-center">
                  <label className="inline-flex items-center mt-6">
                    <input
                      type="checkbox"
                      name="isPharmacist"
                      checked={formData.isPharmacist}
                      onChange={handleCheckboxChange}
                      className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
                    />
                    <span className="ml-2 text-gray-700">I am a Pharmacist</span>
                  </label>
                </div>
              </div>

              {/* Activity Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <FaClipboardList className="w-4 h-4 text-gray-400 mr-2" />
                    Activity Type
                  </span>
                </label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                  required
                >
                  <option value="">Select Activity Type</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Tracking */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <FaClock className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Time Tracking
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Start Time Section */}
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <button
                        type="button"
                        onClick={handleStartTime}
                        disabled={isTracking}
                        className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer ${
                          isTracking
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        }`}
                      >
                        <FaPlay className="w-4 h-4 mr-2" />
                        Start Time
                      </button>
                    </div>
                    
                    {/* Manual Start Date/Time Input */}
                    {formData.startTime && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          name="startTime"
                          value={formData.startTime.slice(0, 16)} // Format for datetime-local input
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* End Time Section */}
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <button
                        type="button"
                        onClick={handleEndTime}
                        disabled={!isTracking}
                        className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer ${
                          !isTracking
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        }`}
                      >
                        <FaStop className="w-4 h-4 mr-2" />
                        Stop Time
                      </button>
                    </div>
                    
                    {/* Manual End Date/Time Input */}
                    {formData.endTime && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          name="endTime"
                          value={formData.endTime.slice(0, 16)} // Format for datetime-local input
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Total Time Display */}
                {formData.startTime && formData.endTime && (
                  <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Total time: <span className="font-semibold">{calculateTimeDifference().toFixed(2)} minutes</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <FaStickyNote className="w-4 h-4 text-gray-400 mr-2" />
                    Additional Notes
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm resize-none hover:bg-gray-100 transition-colors"
                  placeholder="Add any relevant details or observations..."
                />
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
                    {isSubmitting ? "Saving..." : "Save Activity"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddActivityModal; 