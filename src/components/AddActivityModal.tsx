import React, { useState, useEffect } from "react";
import {
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
import { useAuth } from "../contexts/AuthContext";

interface ActivityForm {
  patientId: string;
  activityType: string;
  startTime: string;
  endTime: string;
  notes: string;
  medicalChecks: {
    medicalRecords: boolean;
    bpAtGoal: boolean;
    hospitalVisit: boolean;
    a1cAtGoal: boolean;
    benzodiazepines: boolean;
    antipsychotics: boolean;
    opioids: boolean;
    fallSinceLastVisit: boolean;
  };
}

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityAdded?: () => void;
  patientId?: string;
  patientName?: string;
  // Optional patients list to avoid loading
  patients?: Patient[];
}

const AddActivityModal: React.FC<AddActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  onActivityAdded,
  patientId: initialPatientId,
  patientName,
  patients: providedPatients = [] 
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>(providedPatients);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(providedPatients.length === 0);
  
  const [formData, setFormData] = useState<ActivityForm>({
    patientId: initialPatientId || "",
    activityType: "",
    startTime: "",
    endTime: "",
    notes: "",
    medicalChecks: {
      medicalRecords: false,
      bpAtGoal: false,
      hospitalVisit: false,
      a1cAtGoal: false,
      benzodiazepines: false,
      antipsychotics: false,
      opioids: false,
      fallSinceLastVisit: false
    }
  });

  const [isTracking, setIsTracking] = useState(false);

  // Create initial form state function
  const getInitialFormState = (): ActivityForm => ({
    patientId: initialPatientId || "",
    activityType: "",
    startTime: "",
    endTime: "",
    notes: "",
    medicalChecks: {
      medicalRecords: false,
      bpAtGoal: false,
      hospitalVisit: false,
      a1cAtGoal: false,
      benzodiazepines: false,
      antipsychotics: false,
      opioids: false,
      fallSinceLastVisit: false
    }
  });

  // Update patients state when providedPatients changes
  useEffect(() => {
    if (providedPatients.length > 0) {
      setPatients(providedPatients);
      setIsLoadingData(false);
    }
  }, [providedPatients]);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    setError(null);
    
    try {
      const [activityTypesData, patientsData] = await Promise.all([
        getActivityTypes(),
        providedPatients.length > 0 ? Promise.resolve(providedPatients) : getPatients()
      ]);
      
      setActivityTypes(activityTypesData);
      if (providedPatients.length === 0) {
        setPatients(patientsData);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Failed to load required data. Please try again.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Reset form completely when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all form data to initial state
      setFormData(getInitialFormState());
      // Reset tracking state
      setIsTracking(false);
      // Clear any errors
      setError(null);
      // Reset submission state
      setIsSubmitting(false);
    }
  }, [isOpen, initialPatientId]);

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
    
    if (!formData.patientId || !formData.activityType) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (!formData.startTime || !formData.endTime) {
      alert("Please track time by using the Start and Stop buttons");
      return;
    }
    
    if (!user?.id) {
      alert("You must be logged in to create an activity");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const activityData: CreateActivityDTO = {
        patient_id: parseInt(formData.patientId),
        user_id: user.id,
        activity_type: formData.activityType,
        building: "",
        site_name: "",
        time_spent: calculateTimeDifference(),
        notes: formData.notes,
        medical_checks: {
          medical_records: formData.medicalChecks.medicalRecords,
          bp_at_goal: formData.medicalChecks.bpAtGoal,
          hospital_visit: formData.medicalChecks.hospitalVisit,
          a1c_at_goal: formData.medicalChecks.a1cAtGoal,
          benzodiazepines: formData.medicalChecks.benzodiazepines,
          antipsychotics: formData.medicalChecks.antipsychotics,
          opioids: formData.medicalChecks.opioids,
          fall_since_last_visit: formData.medicalChecks.fallSinceLastVisit
        }
      };
      
      await createActivity(activityData);
      
      if (onActivityAdded) {
        onActivityAdded();
      }
      
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
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-4"
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Activity</h2>
              <p className="mt-1 text-sm text-gray-600">
                Please fill in all the required information to track an activity.
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
              {/* Patient and Activity Type Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Patient Selection */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <FaHospital className="w-4 h-4 text-gray-400 mr-2" />
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
              </div>

              {/* Medical Checklist */}
              <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <FaClipboardList className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Medical Checklist
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.medicalRecords"
                          checked={formData.medicalChecks.medicalRecords}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                medicalRecords: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Medical Records</span>
                      </div>
                    </label>

                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.bpAtGoal"
                          checked={formData.medicalChecks.bpAtGoal}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                bpAtGoal: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">BP at Goal</span>
                      </div>
                    </label>

                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.hospitalVisit"
                          checked={formData.medicalChecks.hospitalVisit}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                hospitalVisit: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Hospital Visit Since Last Review</span>
                      </div>
                    </label>

                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.a1cAtGoal"
                          checked={formData.medicalChecks.a1cAtGoal}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                a1cAtGoal: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">A1C at Goal</span>
                      </div>
                    </label>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.benzodiazepines"
                          checked={formData.medicalChecks.benzodiazepines}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                benzodiazepines: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Benzodiazepines</span>
                      </div>
                    </label>

                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.antipsychotics"
                          checked={formData.medicalChecks.antipsychotics}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                antipsychotics: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Antipsychotics</span>
                      </div>
                    </label>

                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.opioids"
                          checked={formData.medicalChecks.opioids}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                opioids: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Opioids</span>
                      </div>
                    </label>

                    <label className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="medicalChecks.fallSinceLastVisit"
                          checked={formData.medicalChecks.fallSinceLastVisit}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              medicalChecks: {
                                ...prev.medicalChecks,
                                fallSinceLastVisit: e.target.checked
                              }
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="text-gray-700">Fall Since Last Visit</span>
                      </div>
                    </label>
                  </div>
                </div>
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